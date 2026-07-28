/**
 * ControlPanel — the shared panel/control renderer for all tekto GUIs.
 *
 * One implementation of sliders, toggles, selects, color pickers, text
 * inputs, buttons, menus, tabs, and accordion groups — consumed by
 * `sketch()` (3D), `sketch2d()` (2D canvas), and `appShell()` (persistent
 * apps). Values live in a {@link ParamStore}; the panel renders its
 * definitions and keeps the DOM in sync with the store in both directions.
 *
 * Pure DOM, no framework dependency. Styling comes from {@link Theme}
 * (white-on-dark chrome — see CLAUDE.md "GUI defaults").
 *
 * Lifecycle: call `render(items, ...)` whenever the CONTROL STRUCTURE
 * changes (params added/removed). Value-only changes never need a re-render
 * — the store subscription updates the live controls in place, which is what
 * preserves slider focus during a drag.
 */

import { ParamStore, ParamDef } from "./Params";
import { Theme, getTheme } from "./theme";

// ─── Public types ────────────────────────────────────────────────────

/** One control to render: which store key, and where it goes in the panel. */
export interface ControlItem {
  key: string;
  /** Accordion section (default "Parameters") */
  group?: string;
  /** Tab name — panel shows a tab bar when 2+ distinct tabs exist */
  tab?: string;
  /** Menu name — control renders inside a top menu dropdown instead of a section (toggles only) */
  menu?: string;
  /** Per-control accent override (slider track thumb color) */
  accent?: string;
}

/**
 * An action button. Buttons are looked up at CLICK time via `getButtons`,
 * because immediate-mode owners (sketch) recreate the action closures on
 * every re-run while the panel DOM persists — capturing `action` directly
 * would call a stale closure.
 */
export interface PanelButton {
  label: string;
  action: () => void;
  group?: string;
  tab?: string;
  menu?: string;
  /** Display-only action (camera moves, restyling): skip the owner's
   *  post-action hook (which typically re-runs the sketch). */
  display?: boolean;
}

/** A caller-owned element hosted in the panel (e.g. a LayerPanel tree). */
export interface CustomRow {
  key: string;
  el: HTMLElement;
  group?: string;
  tab?: string;
  /** Bleed past the section's horizontal padding (full-width components) */
  fullBleed?: boolean;
}

/** A tab whose content the owner renders itself (e.g. sketch's Info tab). */
export interface ExtraTab {
  name: string;
  render: (container: HTMLElement) => void;
}

export interface ControlPanelConfig {
  store: ParamStore;
  theme?: Theme;
  /** Current buttons — re-read at render AND click time (see PanelButton). */
  getButtons?: () => PanelButton[];
  /** Slider drag ended / discrete control committed a value. */
  onCommit?: (key: string) => void;
  /** A button or menu action ran (owners typically re-run the sketch). */
  onAction?: () => void;
  /** The user switched to another tab (panel re-renders itself first). */
  onTabChange?: (tab: string) => void;
}

const DEFAULT_GROUP = "Parameters";

// Rectangular ("scientific") range sliders — flat track, square thumb — the
// tekto default look. Pseudo-element thumbs can't be styled inline, so a
// stylesheet is injected once per document; per-control colors flow through
// the CSS variables set inline on each input.
const SLIDER_STYLE_ID = "tekto-slider-style";
export function ensureSliderStyle(doc: Document): void {
  if (doc.getElementById(SLIDER_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = SLIDER_STYLE_ID;
  el.textContent = `
    .tekto-slider{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;height:16px;outline:none;padding:0;}
    .tekto-slider::-webkit-slider-runnable-track{height:4px;background:var(--tekto-track,#2a2d44);}
    .tekto-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:7px;height:14px;margin-top:-5px;border-radius:0;background:var(--tekto-thumb,#ffffff);}
    .tekto-slider::-moz-range-track{height:4px;background:var(--tekto-track,#2a2d44);}
    .tekto-slider::-moz-range-thumb{width:7px;height:14px;border-radius:0;border:none;background:var(--tekto-thumb,#ffffff);}
  `;
  doc.head.appendChild(el);
}

// ─── ControlPanel ────────────────────────────────────────────────────

export class ControlPanel {
  /** Mount this element in your panel container. */
  readonly el: HTMLElement;
  /**
   * Persistent footer container, re-attached below the sections on every
   * render. Owners park their info/log nodes here and update them in place.
   */
  readonly footer: HTMLElement;

  private store: ParamStore;
  private theme: Theme;
  private cfg: ControlPanelConfig;

  private collapsedGroups = new Set<string>();
  private activeTab = "";
  private activeMenu = "";

  // Rebuilt on each render — current structure + live-DOM value updaters
  private items: ControlItem[] = [];
  private customRows: CustomRow[] = [];
  private extraTabs: ExtraTab[] = [];
  private updaters = new Map<string, (v: any) => void>();
  private unsubStore: () => void;
  private docClick: (e: MouseEvent) => void;

  constructor(cfg: ControlPanelConfig) {
    this.cfg = cfg;
    this.store = cfg.store;
    this.theme = cfg.theme ?? getTheme();
    this.el = document.createElement("div");
    this.footer = document.createElement("div");

    ensureSliderStyle(document);
    this.unsubStore = this.store.onChange((key, value) => {
      this.updaters.get(key)?.(value);
    });
    // One document-level listener to close open menus (added once, not per render)
    this.docClick = () => this.closeMenus();
    document.addEventListener("click", this.docClick);
  }

  dispose(): void {
    this.unsubStore();
    document.removeEventListener("click", this.docClick);
    this.el.innerHTML = "";
  }

  /** Rebuild the panel DOM for a new control structure. */
  render(items: ControlItem[], customRows: CustomRow[] = [], extraTabs: ExtraTab[] = []): void {
    this.items = items;
    this.customRows = customRows;
    this.extraTabs = extraTabs;
    this.updaters.clear();
    this.el.innerHTML = "";

    const t = this.theme;
    const buttons = this.cfg.getButtons?.() ?? [];

    // ── Menus ──
    const menuNames: string[] = [];
    for (const it of items) if (it.menu && !menuNames.includes(it.menu)) menuNames.push(it.menu);
    for (const b of buttons) if (b.menu && !menuNames.includes(b.menu)) menuNames.push(b.menu);
    if (menuNames.length > 0) this.el.appendChild(this.buildMenuBar(menuNames, items, buttons));

    // ── Tabs ──
    const tabOrder: string[] = [];
    for (const it of items) if (it.tab && !tabOrder.includes(it.tab)) tabOrder.push(it.tab);
    for (const b of buttons) if (b.tab && !tabOrder.includes(b.tab)) tabOrder.push(b.tab);
    for (const r of customRows) if (r.tab && !tabOrder.includes(r.tab)) tabOrder.push(r.tab);
    for (const et of extraTabs) if (!tabOrder.includes(et.name)) tabOrder.push(et.name);
    const hasTabs = tabOrder.length > 1;
    if (hasTabs && (!this.activeTab || !tabOrder.includes(this.activeTab))) {
      this.activeTab = tabOrder[0];
    }
    // ── Pinned strip: when tabs exist, controls with neither tab nor menu are GLOBAL (e.g. a view-mode
    //    selector) — render them once, always visible, ABOVE the tab bar instead of inside every tab. ──
    const pinnedItems = hasTabs ? items.filter(it => !it.tab && !it.menu) : [];
    const pinnedButtons = hasTabs ? buttons.filter(b => !b.tab && !b.menu) : [];
    if (pinnedItems.length || pinnedButtons.length) {
      const strip = document.createElement("div");
      strip.style.cssText = `padding:4px 8px 2px;border-bottom:1px solid ${t.border};`;
      for (const it of pinnedItems) { const row = this.buildControl(it); if (row) strip.appendChild(row); }
      for (const b of pinnedButtons) strip.appendChild(this.buildButtonRow(b));
      this.el.appendChild(strip);
    }
    if (hasTabs) this.el.appendChild(this.buildTabBar(tabOrder));

    // Extra tab active → owner renders the content, skip sections
    const activeExtra = hasTabs ? this.extraTabs.find(et => et.name === this.activeTab) : undefined;
    if (activeExtra) {
      const host = document.createElement("div");
      activeExtra.render(host);
      this.el.appendChild(host);
      this.el.appendChild(this.footer);
      return;
    }

    // ── Sections (accordion groups), filtered to the active tab. With tabs present, tab-less controls
    //    are in the pinned strip above — exclude them here. ──
    const inTab = (tab?: string, menu?: string) =>
      !menu && (hasTabs ? (!!tab && tab === this.activeTab) : true);

    const groups = new Map<string, { items: ControlItem[]; buttons: PanelButton[]; rows: CustomRow[] }>();
    const groupOf = (name?: string) => {
      const g = name || DEFAULT_GROUP;
      if (!groups.has(g)) groups.set(g, { items: [], buttons: [], rows: [] });
      return groups.get(g)!;
    };
    for (const it of items) if (inTab(it.tab, it.menu)) groupOf(it.group).items.push(it);
    for (const b of buttons) if (inTab(b.tab, b.menu)) groupOf(b.group).buttons.push(b);
    for (const r of customRows) if (inTab(r.tab)) groupOf(r.group).rows.push(r);

    for (const [name, content] of groups) {
      this.el.appendChild(this.buildSection(name, content));
    }

    this.el.appendChild(this.footer);
  }

  /** Push a value into a live control without going through the store. */
  applyValue(key: string, value: any): void {
    this.updaters.get(key)?.(value);
  }

  private closeMenus(): void {
    this.activeMenu = "";
    this.el.querySelectorAll<HTMLElement>("[data-menu-dropdown]").forEach(d => { d.style.display = "none"; });
    this.el.querySelectorAll<HTMLElement>("[data-menu-btn]").forEach(b => { b.style.color = this.theme.textFaint; });
  }

  // ── Menu bar ──

  private buildMenuBar(menuNames: string[], items: ControlItem[], buttons: PanelButton[]): HTMLElement {
    const t = this.theme;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;border-bottom:1px solid ${t.border};flex-shrink:0;position:relative;`;

    for (const menuName of menuNames) {
      const btn = document.createElement("button");
      btn.dataset.menuBtn = menuName;
      btn.textContent = menuName + " ▾";
      btn.style.cssText = `
        padding:8px 10px;border:none;background:transparent;
        color:${t.textFaint};font-family:inherit;font-size:9px;font-weight:500;
        text-transform:uppercase;letter-spacing:1.2px;cursor:pointer;transition:color .12s;
      `;
      btn.addEventListener("mouseenter", () => { btn.style.color = t.accent; });
      btn.addEventListener("mouseleave", () => { btn.style.color = this.activeMenu === menuName ? t.accent : t.textFaint; });

      const dropdown = document.createElement("div");
      dropdown.dataset.menuDropdown = menuName;
      dropdown.style.cssText = `
        display:none;position:absolute;top:100%;left:0;z-index:100;
        min-width:160px;background:${t.popupBg};
        border:1px solid ${t.border};border-radius:4px;padding:4px 0;
        box-shadow:0 4px 16px rgba(0,0,0,.4);
      `;

      const menuItems = items.filter(it => it.menu === menuName);
      const menuButtons = buttons.filter(b => b.menu === menuName);

      for (const it of menuItems) {
        const def = this.store.getDef(it.key) as ParamDef | undefined;
        if (!def) continue;
        // Selects render as a radio-style option list: one row per option, ✓ on the active one.
        if (def.type === "select") {
          const opts = def.options ?? [];
          const rows: { opt: string; check: HTMLSpanElement }[] = [];
          for (const opt of opts) {
            const row = document.createElement("div");
            row.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:11px;color:${t.textDim};transition:background .1s;`;
            const check = document.createElement("span");
            check.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
            check.textContent = this.store.get(it.key) === opt ? "✓" : " ";
            const lbl = document.createElement("span");
            lbl.textContent = opt;
            row.append(check, lbl);
            row.addEventListener("mouseenter", () => { row.style.background = t.hoverBg; });
            row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });
            row.addEventListener("click", (e) => {
              e.stopPropagation();
              this.store.set(it.key, opt);
              for (const r of rows) r.check.textContent = r.opt === opt ? "✓" : " ";
              this.cfg.onCommit?.(it.key);
            });
            rows.push({ opt, check });
            dropdown.appendChild(row);
          }
          this.updaters.set(it.key, (v) => { for (const r of rows) r.check.textContent = r.opt === v ? "✓" : " "; });
          continue;
        }
        if (def.type !== "bool") continue; // other kinds don't fit a menu
        const row = document.createElement("div");
        row.style.cssText = `
          display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;
          font-size:11px;color:${t.textDim};transition:background .1s;
        `;
        const check = document.createElement("span");
        check.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
        check.textContent = this.store.get(it.key) ? "✓" : " ";
        const lbl = document.createElement("span");
        lbl.textContent = def.label ?? it.key;
        row.append(check, lbl);
        row.addEventListener("mouseenter", () => { row.style.background = t.hoverBg; });
        row.addEventListener("mouseleave", () => { row.style.background = "transparent"; });
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          this.store.set(it.key, !this.store.get(it.key));
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => { check.textContent = v ? "✓" : " "; });
        dropdown.appendChild(row);
      }

      if (menuItems.length > 0 && menuButtons.length > 0) {
        const sep = document.createElement("div");
        sep.style.cssText = `border-top:1px solid ${t.border};margin:4px 0;`;
        dropdown.appendChild(sep);
      }

      for (const b of menuButtons) {
        const row = document.createElement("div");
        row.style.cssText = `padding:7px 12px;cursor:pointer;font-size:11px;color:${t.textDim};transition:background .1s;`;
        row.textContent = b.label;
        row.addEventListener("mouseenter", () => { row.style.background = t.hoverBg; row.style.color = t.accent; });
        row.addEventListener("mouseleave", () => { row.style.background = "transparent"; row.style.color = t.textDim; });
        const btnLabel = b.label, btnMenu = b.menu, btnGroup = b.group;
        row.addEventListener("click", () => {
          this.closeMenus();
          const current = (this.cfg.getButtons?.() ?? [])
            .find(cb => cb.label === btnLabel && cb.menu === btnMenu && cb.group === btnGroup);
          current?.action();
          if (!current?.display) this.cfg.onAction?.();
        });
        dropdown.appendChild(row);
      }

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.activeMenu === menuName;
        this.closeMenus();
        if (!isOpen) {
          this.activeMenu = menuName;
          dropdown.style.display = "block";
          btn.style.color = t.accent;
        }
      });

      // Anchor each dropdown to ITS button (not the bar) so it opens right below the menu name.
      const holder = document.createElement("div");
      holder.style.cssText = `position:relative;display:inline-block;`;
      holder.appendChild(btn);
      holder.appendChild(dropdown);
      bar.appendChild(holder);
    }
    return bar;
  }

  // ── Tab bar ──

  /** The currently active tab name ("" when the panel has no tabs). */
  getActiveTab(): string { return this.activeTab; }

  private buildTabBar(tabOrder: string[]): HTMLElement {
    const t = this.theme;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;border-bottom:1px solid ${t.border};flex-shrink:0;`;
    for (const tab of tabOrder) {
      const btn = document.createElement("button");
      btn.textContent = tab;
      const isActive = tab === this.activeTab;
      btn.style.cssText = `
        flex:1;padding:9px 4px;border:none;
        border-bottom:2px solid ${isActive ? t.accent : "transparent"};
        background:transparent;color:${isActive ? t.accent : t.textFaint};
        font-family:inherit;font-size:9px;font-weight:500;text-transform:uppercase;
        letter-spacing:1.2px;cursor:pointer;transition:all .12s;
      `;
      btn.addEventListener("click", () => {
        this.activeTab = tab;
        this.render(this.items, this.customRows, this.extraTabs);
        this.cfg.onTabChange?.(tab);
      });
      bar.appendChild(btn);
    }
    return bar;
  }

  // ── Sections ──

  private buildSection(
    name: string,
    content: { items: ControlItem[]; buttons: PanelButton[]; rows: CustomRow[] },
  ): HTMLElement {
    const t = this.theme;
    const section = document.createElement("div");
    section.style.cssText = `border-bottom:1px solid ${t.border};`;
    const collapsed = this.collapsedGroups.has(name);

    const header = document.createElement("div");
    header.style.cssText = `
      padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
      user-select:none;transition:background .1s;
    `;
    header.addEventListener("mouseenter", () => { header.style.background = t.hoverBg; });
    header.addEventListener("mouseleave", () => { header.style.background = "transparent"; });

    const arrow = document.createElement("span");
    arrow.style.cssText = `font-size:8px;color:${t.textFaint};transition:transform .15s;width:10px;`;
    arrow.textContent = collapsed ? "▶" : "▼";
    header.appendChild(arrow);

    const title = document.createElement("span");
    title.style.cssText = `font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1.8px;color:${t.textFaint};`;
    title.textContent = name;
    header.appendChild(title);
    section.appendChild(header);

    const body = document.createElement("div");
    body.style.cssText = `padding:0 14px 10px;${collapsed ? "display:none;" : ""}`;

    for (const it of content.items) {
      const row = this.buildControl(it);
      if (row) body.appendChild(row);
    }
    for (const r of content.rows) {
      if (r.fullBleed) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "margin:0 -14px;";
        wrap.appendChild(r.el);
        body.appendChild(wrap);
      } else {
        body.appendChild(r.el);
      }
    }
    for (const b of content.buttons) {
      body.appendChild(this.buildButtonRow(b));
    }
    section.appendChild(body);

    header.addEventListener("click", () => {
      const isCollapsed = this.collapsedGroups.has(name);
      if (isCollapsed) this.collapsedGroups.delete(name);
      else this.collapsedGroups.add(name);
      body.style.display = isCollapsed ? "" : "none";
      arrow.textContent = isCollapsed ? "▼" : "▶";
    });

    return section;
  }

  // ── Individual controls ──

  private buildButtonRow(b: PanelButton): HTMLElement {
    const t = this.theme;
    const row = document.createElement("div");
    row.style.cssText = "margin-bottom:4px;";
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.style.cssText = `
      width:100%;padding:7px 10px;border:1px solid ${t.border};border-radius:5px;
      background:transparent;color:${t.textDim};font-family:inherit;font-size:10px;
      cursor:pointer;transition:all .12s;
    `;
    btn.addEventListener("mouseenter", () => { btn.style.background = t.hoverBg; btn.style.borderColor = t.accent; btn.style.color = t.accent; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; btn.style.borderColor = t.border; btn.style.color = t.textDim; });
    const label = b.label, group = b.group, menu = b.menu;
    btn.addEventListener("click", () => {
      const current = (this.cfg.getButtons?.() ?? [])
        .find(cb => cb.label === label && cb.group === group && cb.menu === menu)
        ?? b; // static owners (appShell) pass stable closures
      current.action();
      if (!current.display) this.cfg.onAction?.();
    });
    row.appendChild(btn);
    return row;
  }

  private buildControl(it: ControlItem): HTMLElement | null {
    const def = this.store.getDef(it.key) as ParamDef | undefined;
    if (!def) return null;
    const t = this.theme;

    // Buttons declared in the schema (appShell-style) render as button rows.
    if (def.type === "button") {
      return this.buildButtonRow({ label: def.label ?? it.key, action: def.action, group: it.group });
    }

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:5px;min-height:26px;";

    const label = document.createElement("span");
    label.style.cssText = `width:80px;flex-shrink:0;font-size:11px;color:${t.textDim};text-transform:capitalize;`;
    label.textContent = def.label ?? it.key;
    row.appendChild(label);

    switch (def.type) {
      case "float":
      case "int": {
        const step = def.step ?? (def.type === "int" ? 1 : (def.max - def.min) / 100);
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(def.min);
        input.max = String(def.max);
        input.step = String(step);
        input.value = String(this.store.get(it.key));
        input.className = "tekto-slider";
        input.style.cssText = `flex:1;--tekto-track:${t.controlBorder};--tekto-thumb:${it.accent || t.accent};`;

        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `width:42px;text-align:right;font-size:10px;color:${t.accent};`;
        const isInt = def.type === "int" || step >= 1;
        const rawDec = isInt ? 0 : Math.max(2, -Math.floor(Math.log10(step) - 0.001));
        const decimals = Math.min(Math.max(0, rawDec), 20);
        const fmt = (v: number) => isInt ? String(Math.round(v)) : Number(v).toFixed(decimals);
        valueSpan.textContent = fmt(this.store.get(it.key));

        input.addEventListener("input", () => {
          this.store.set(it.key, parseFloat(input.value));
        });
        input.addEventListener("change", () => this.cfg.onCommit?.(it.key));
        this.updaters.set(it.key, (v) => {
          input.value = String(v);
          valueSpan.textContent = fmt(v);
        });

        row.append(input, valueSpan);
        break;
      }

      case "bool": {
        // Sliding switch — white track with dark knob when ON (the tekto default)
        const wrap = document.createElement("label");
        wrap.style.cssText = "position:relative;width:32px;height:18px;cursor:pointer;flex-shrink:0;";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!this.store.get(it.key);
        input.style.cssText = "position:absolute;opacity:0;width:0;height:0;";
        const track = document.createElement("span");
        const knob = document.createElement("span");
        const paint = (on: boolean) => {
          track.style.cssText = `position:absolute;inset:0;border-radius:9px;transition:.2s;background:${on ? t.accent : t.controlBorder};`;
          knob.style.cssText = `position:absolute;left:${on ? "16px" : "2px"};top:2px;width:14px;height:14px;border-radius:50%;background:${on ? t.panelBg : "#ffffff"};transition:.2s;`;
        };
        paint(input.checked);
        track.appendChild(knob);
        wrap.append(input, track);
        input.addEventListener("change", () => {
          paint(input.checked);
          this.store.set(it.key, input.checked);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => { input.checked = !!v; paint(!!v); });
        row.appendChild(wrap);
        break;
      }

      case "select": {
        const select = document.createElement("select");
        select.style.cssText = `
          flex:1;padding:4px 8px;background:${t.fieldBg};
          border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;cursor:pointer;
        `;
        for (const opt of def.options) {
          const el = document.createElement("option");
          el.value = opt;
          el.textContent = opt;
          if (opt === this.store.get(it.key)) el.selected = true;
          select.appendChild(el);
        }
        select.addEventListener("change", () => {
          this.store.set(it.key, select.value);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => { select.value = v; });
        row.appendChild(select);
        break;
      }

      case "color": {
        const input = document.createElement("input");
        input.type = "color";
        input.value = this.store.get(it.key);
        input.style.cssText = `width:32px;height:24px;border:1px solid ${t.controlBorder};border-radius:4px;padding:0;cursor:pointer;background:none;`;
        const valueSpan = document.createElement("span");
        valueSpan.style.cssText = `font-size:10px;color:${t.textDim};`;
        valueSpan.textContent = this.store.get(it.key);
        input.addEventListener("input", () => {
          this.store.set(it.key, input.value);
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => { input.value = v; valueSpan.textContent = v; });
        row.append(input, valueSpan);
        break;
      }

      case "string": {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this.store.get(it.key) ?? "";
        input.placeholder = def.placeholder ?? "";
        input.style.cssText = `
          flex:1;padding:4px 8px;background:${t.fieldBg};
          border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
          font-family:inherit;font-size:11px;outline:none;
        `;
        input.addEventListener("input", () => { this.store.set(it.key, input.value); });
        input.addEventListener("change", () => this.cfg.onCommit?.(it.key));
        this.updaters.set(it.key, (v) => { if (input !== document.activeElement) input.value = v; });
        row.appendChild(input);
        break;
      }

      case "vec3": {
        const inputs: HTMLInputElement[] = [];
        for (let i = 0; i < 3; i++) {
          const input = document.createElement("input");
          input.type = "number";
          if (def.step != null) input.step = String(def.step);
          input.value = String((this.store.get(it.key) ?? def.default)[i]);
          input.style.cssText = `
            flex:1;width:0;padding:3px 4px;background:${t.fieldBg};
            border:1px solid ${t.controlBorder};border-radius:4px;color:inherit;
            font-family:inherit;font-size:10px;outline:none;
          `;
          input.addEventListener("change", () => {
            const next = inputs.map(el => Number(el.value)) as [number, number, number];
            this.store.set(it.key, next);
            this.cfg.onCommit?.(it.key);
          });
          inputs.push(input);
          row.appendChild(input);
        }
        this.updaters.set(it.key, (v) => {
          for (let i = 0; i < 3; i++) inputs[i].value = String(v[i]);
        });
        break;
      }
    }

    return row;
  }
}
