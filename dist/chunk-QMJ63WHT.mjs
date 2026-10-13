import {
  DASH_PATTERNS,
  ParamStore,
  boundsOf,
  createRandom,
  noise,
  pickPrim
} from "./chunk-QA7NH7ES.mjs";
import {
  MathUtils,
  Vec2
} from "./chunk-VTSIDLJ7.mjs";

// src/gui/theme.ts
var DARK = {
  isDark: true,
  bg: "#07080e",
  panelBg: "#0c0d16",
  popupBg: "#0d0f1e",
  border: "#16182a",
  controlBorder: "#1e2140",
  text: "#b8bdd4",
  textDim: "#7a80a0",
  textFaint: "#5a6080",
  accent: "#ffffff",
  hoverBg: "rgba(255,255,255,.06)",
  fieldBg: "#07080e",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
var LIGHT = {
  isDark: false,
  bg: "#f4f5f8",
  panelBg: "#ffffff",
  popupBg: "#f5f6fa",
  border: "#e0e2ea",
  controlBorder: "#d0d3de",
  text: "#2a2d3a",
  textDim: "#5a6080",
  textFaint: "#8a8fa0",
  accent: "#16182c",
  hoverBg: "rgba(0,0,0,.05)",
  fieldBg: "#f4f5f8",
  font: "'IBM Plex Mono',ui-monospace,monospace"
};
function getTheme(mode = "dark") {
  return mode === "light" ? LIGHT : DARK;
}

// src/gui/ControlPanel.ts
var DEFAULT_GROUP = "Parameters";
var SLIDER_STYLE_ID = "tekto-slider-style";
function ensureSliderStyle(doc) {
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
var ControlPanel = class {
  constructor(cfg) {
    this.collapsedGroups = /* @__PURE__ */ new Set();
    this.activeTab = "";
    this.activeMenu = "";
    // Rebuilt on each render — current structure + live-DOM value updaters
    this.items = [];
    this.customRows = [];
    this.extraTabs = [];
    this.updaters = /* @__PURE__ */ new Map();
    this.cfg = cfg;
    this.store = cfg.store;
    this.theme = cfg.theme ?? getTheme();
    this.el = document.createElement("div");
    this.footer = document.createElement("div");
    ensureSliderStyle(document);
    this.unsubStore = this.store.onChange((key, value) => {
      this.updaters.get(key)?.(value);
    });
    this.docClick = () => this.closeMenus();
    document.addEventListener("click", this.docClick);
  }
  dispose() {
    this.unsubStore();
    document.removeEventListener("click", this.docClick);
    this.el.innerHTML = "";
  }
  /** Rebuild the panel DOM for a new control structure. */
  render(items, customRows = [], extraTabs = []) {
    this.items = items;
    this.customRows = customRows;
    this.extraTabs = extraTabs;
    this.updaters.clear();
    this.el.innerHTML = "";
    const t = this.theme;
    const buttons = this.cfg.getButtons?.() ?? [];
    const menuNames = [];
    for (const it of items) if (it.menu && !menuNames.includes(it.menu)) menuNames.push(it.menu);
    for (const b of buttons) if (b.menu && !menuNames.includes(b.menu)) menuNames.push(b.menu);
    if (menuNames.length > 0) this.el.appendChild(this.buildMenuBar(menuNames, items, buttons));
    const tabOrder = [];
    for (const it of items) if (it.tab && !tabOrder.includes(it.tab)) tabOrder.push(it.tab);
    for (const b of buttons) if (b.tab && !tabOrder.includes(b.tab)) tabOrder.push(b.tab);
    for (const r of customRows) if (r.tab && !tabOrder.includes(r.tab)) tabOrder.push(r.tab);
    for (const et of extraTabs) if (!tabOrder.includes(et.name)) tabOrder.push(et.name);
    const hasTabs = tabOrder.length > 1;
    if (hasTabs && (!this.activeTab || !tabOrder.includes(this.activeTab))) {
      this.activeTab = tabOrder[0];
    }
    const pinnedItems = hasTabs ? items.filter((it) => !it.tab && !it.menu) : [];
    const pinnedButtons = hasTabs ? buttons.filter((b) => !b.tab && !b.menu) : [];
    if (pinnedItems.length || pinnedButtons.length) {
      const strip = document.createElement("div");
      strip.style.cssText = `padding:4px 8px 2px;border-bottom:1px solid ${t.border};`;
      for (const it of pinnedItems) {
        const row = this.buildControl(it);
        if (row) strip.appendChild(row);
      }
      for (const b of pinnedButtons) strip.appendChild(this.buildButtonRow(b));
      this.el.appendChild(strip);
    }
    if (hasTabs) this.el.appendChild(this.buildTabBar(tabOrder));
    const activeExtra = hasTabs ? this.extraTabs.find((et) => et.name === this.activeTab) : void 0;
    if (activeExtra) {
      const host = document.createElement("div");
      activeExtra.render(host);
      this.el.appendChild(host);
      this.el.appendChild(this.footer);
      return;
    }
    const inTab = (tab, menu) => !menu && (hasTabs ? !!tab && tab === this.activeTab : true);
    const groups = /* @__PURE__ */ new Map();
    const groupOf = (name) => {
      const g = name || DEFAULT_GROUP;
      if (!groups.has(g)) groups.set(g, { items: [], buttons: [], rows: [] });
      return groups.get(g);
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
  applyValue(key, value) {
    this.updaters.get(key)?.(value);
  }
  closeMenus() {
    this.activeMenu = "";
    this.el.querySelectorAll("[data-menu-dropdown]").forEach((d) => {
      d.style.display = "none";
    });
    this.el.querySelectorAll("[data-menu-btn]").forEach((b) => {
      b.style.color = this.theme.textFaint;
    });
  }
  // ── Menu bar ──
  buildMenuBar(menuNames, items, buttons) {
    const t = this.theme;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;border-bottom:1px solid ${t.border};flex-shrink:0;position:relative;`;
    for (const menuName of menuNames) {
      const btn = document.createElement("button");
      btn.dataset.menuBtn = menuName;
      btn.textContent = menuName + " \u25BE";
      btn.style.cssText = `
        padding:8px 10px;border:none;background:transparent;
        color:${t.textFaint};font-family:inherit;font-size:9px;font-weight:500;
        text-transform:uppercase;letter-spacing:1.2px;cursor:pointer;transition:color .12s;
      `;
      btn.addEventListener("mouseenter", () => {
        btn.style.color = t.accent;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.color = this.activeMenu === menuName ? t.accent : t.textFaint;
      });
      const dropdown = document.createElement("div");
      dropdown.dataset.menuDropdown = menuName;
      dropdown.style.cssText = `
        display:none;position:fixed;z-index:1000;overflow-y:auto;
        min-width:160px;background:${t.popupBg};
        border:1px solid ${t.border};border-radius:4px;padding:4px 0;
        box-shadow:0 4px 16px rgba(0,0,0,.4);
      `;
      const menuItems = items.filter((it) => it.menu === menuName);
      const menuButtons = buttons.filter((b) => b.menu === menuName);
      for (const it of menuItems) {
        const def = this.store.getDef(it.key);
        if (!def) continue;
        if (def.type === "select") {
          const opts = def.options ?? [];
          const rows = [];
          for (const opt of opts) {
            const row2 = document.createElement("div");
            row2.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:11px;color:${t.textDim};transition:background .1s;`;
            const check2 = document.createElement("span");
            check2.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
            check2.textContent = this.store.get(it.key) === opt ? "\u2713" : " ";
            const lbl2 = document.createElement("span");
            lbl2.textContent = opt;
            row2.append(check2, lbl2);
            row2.addEventListener("mouseenter", () => {
              row2.style.background = t.hoverBg;
            });
            row2.addEventListener("mouseleave", () => {
              row2.style.background = "transparent";
            });
            row2.addEventListener("click", (e) => {
              e.stopPropagation();
              this.store.set(it.key, opt);
              for (const r of rows) r.check.textContent = r.opt === opt ? "\u2713" : " ";
              this.cfg.onCommit?.(it.key);
            });
            rows.push({ opt, check: check2 });
            dropdown.appendChild(row2);
          }
          this.updaters.set(it.key, (v) => {
            for (const r of rows) r.check.textContent = r.opt === v ? "\u2713" : " ";
          });
          continue;
        }
        if (def.type !== "bool") continue;
        const row = document.createElement("div");
        row.style.cssText = `
          display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;
          font-size:11px;color:${t.textDim};transition:background .1s;
        `;
        const check = document.createElement("span");
        check.style.cssText = `width:12px;text-align:center;color:${t.accent};font-size:10px;`;
        check.textContent = this.store.get(it.key) ? "\u2713" : " ";
        const lbl = document.createElement("span");
        lbl.textContent = def.label ?? it.key;
        row.append(check, lbl);
        row.addEventListener("mouseenter", () => {
          row.style.background = t.hoverBg;
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = "transparent";
        });
        row.addEventListener("click", (e) => {
          e.stopPropagation();
          this.store.set(it.key, !this.store.get(it.key));
          this.cfg.onCommit?.(it.key);
        });
        this.updaters.set(it.key, (v) => {
          check.textContent = v ? "\u2713" : " ";
        });
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
        row.addEventListener("mouseenter", () => {
          row.style.background = t.hoverBg;
          row.style.color = t.accent;
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = "transparent";
          row.style.color = t.textDim;
        });
        const btnLabel = b.label, btnMenu = b.menu, btnGroup = b.group;
        row.addEventListener("click", () => {
          this.closeMenus();
          const current = (this.cfg.getButtons?.() ?? []).find((cb) => cb.label === btnLabel && cb.menu === btnMenu && cb.group === btnGroup);
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
          const r = btn.getBoundingClientRect();
          dropdown.style.display = "block";
          dropdown.style.top = `${r.bottom}px`;
          dropdown.style.maxHeight = `${Math.max(120, window.innerHeight - r.bottom - 8)}px`;
          dropdown.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - dropdown.offsetWidth - 4))}px`;
          btn.style.color = t.accent;
        }
      });
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
  getActiveTab() {
    return this.activeTab;
  }
  buildTabBar(tabOrder) {
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
  buildSection(name, content) {
    const t = this.theme;
    const section = document.createElement("div");
    section.style.cssText = `border-bottom:1px solid ${t.border};`;
    const collapsed = this.collapsedGroups.has(name);
    const header = document.createElement("div");
    header.style.cssText = `
      padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
      user-select:none;transition:background .1s;
    `;
    header.addEventListener("mouseenter", () => {
      header.style.background = t.hoverBg;
    });
    header.addEventListener("mouseleave", () => {
      header.style.background = "transparent";
    });
    const arrow = document.createElement("span");
    arrow.style.cssText = `font-size:8px;color:${t.textFaint};transition:transform .15s;width:10px;`;
    arrow.textContent = collapsed ? "\u25B6" : "\u25BC";
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
      arrow.textContent = isCollapsed ? "\u25BC" : "\u25B6";
    });
    return section;
  }
  // ── Individual controls ──
  buildButtonRow(b) {
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
    btn.addEventListener("mouseenter", () => {
      btn.style.background = t.hoverBg;
      btn.style.borderColor = t.accent;
      btn.style.color = t.accent;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent";
      btn.style.borderColor = t.border;
      btn.style.color = t.textDim;
    });
    const label = b.label, group = b.group, menu = b.menu;
    btn.addEventListener("click", () => {
      const current = (this.cfg.getButtons?.() ?? []).find((cb) => cb.label === label && cb.group === group && cb.menu === menu) ?? b;
      current.action();
      if (!current.display) this.cfg.onAction?.();
    });
    row.appendChild(btn);
    return row;
  }
  buildControl(it) {
    const def = this.store.getDef(it.key);
    if (!def) return null;
    const t = this.theme;
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
        const rawDec = isInt ? 0 : Math.max(2, -Math.floor(Math.log10(step) - 1e-3));
        const decimals = Math.min(Math.max(0, rawDec), 20);
        const fmt = (v) => isInt ? String(Math.round(v)) : Number(v).toFixed(decimals);
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
        const wrap = document.createElement("label");
        wrap.style.cssText = "position:relative;width:32px;height:18px;cursor:pointer;flex-shrink:0;";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!this.store.get(it.key);
        input.style.cssText = "position:absolute;opacity:0;width:0;height:0;";
        const track = document.createElement("span");
        const knob = document.createElement("span");
        const paint = (on) => {
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
        this.updaters.set(it.key, (v) => {
          input.checked = !!v;
          paint(!!v);
        });
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
        this.updaters.set(it.key, (v) => {
          select.value = v;
        });
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
        this.updaters.set(it.key, (v) => {
          input.value = v;
          valueSpan.textContent = v;
        });
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
        input.addEventListener("input", () => {
          this.store.set(it.key, input.value);
        });
        input.addEventListener("change", () => this.cfg.onCommit?.(it.key));
        this.updaters.set(it.key, (v) => {
          if (input !== document.activeElement) input.value = v;
        });
        row.appendChild(input);
        break;
      }
      case "vec3": {
        const inputs = [];
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
            const next = inputs.map((el) => Number(el.value));
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
};

// src/sketch/AgentBridge.ts
var MAX_ERRORS = 50;
function installAgentBridge(host) {
  const errors = [];
  const record = (msg) => {
    if (errors.length < MAX_ERRORS) errors.push(msg.slice(0, 500));
  };
  const onError = (e) => record(`${e.message}${e.filename ? ` (${e.filename}:${e.lineno})` : ""}`);
  const onRejection = (e) => record(`unhandled rejection: ${String(e.reason?.stack ?? e.reason)}`);
  const origError = console.error;
  const wrapped = (...args) => {
    record(args.map((a) => a instanceof Error ? a.stack ?? a.message : typeof a === "string" ? a : safeJson(a)).join(" "));
    origError.apply(console, args);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  console.error = wrapped;
  const store = host.store;
  window.__tekto = {
    owner: host.owner,
    harness: host.harness,
    snapshot: (opts) => host.snapshot(opts),
    params: () => store.getAll(),
    paramNames: () => store.names(),
    schema: () => paramSchema(store),
    errors: () => [...errors],
    // By label ("Radius"), "Group:Label" or key. Names that match nothing, or more than
    // one control, are reported (and warned about) instead of silently dropped.
    setParams: (p) => {
      const r = store.setByName(p);
      if (r.unknown.length || r.ambiguous.length) {
        console.warn("tekto setParams:", [
          ...r.unknown.map((n) => `no control named "${n}"`),
          ...r.ambiguous.map((a) => `"${a.name}" matches ${a.keys.length} controls \u2014 use Group:Label`)
        ].join("; "), "| controls:", store.names().join(", "));
      }
      return r;
    },
    ...host.camera ? { camera: host.camera } : {},
    // What the app can do — undo, delete, the views … — by id, as a person would by key.
    commands: () => host.commands?.list() ?? [],
    run: (id) => host.commands ? host.commands.run(id) : Promise.resolve(false)
  };
  return {
    errors: () => [...errors],
    dispose() {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (console.error === wrapped) console.error = origError;
      if (window.__tekto?.owner === host.owner) delete window.__tekto;
    }
  };
}
function paramSchema(store) {
  const schema = store.getSchema();
  const names = store.names();
  const values = store.getAll();
  return Object.keys(schema).map((key, i) => {
    const d = schema[key];
    return {
      name: names[i],
      key,
      type: d.type,
      ...d.label ? { label: d.label } : {},
      ...d.min !== void 0 ? { min: d.min } : {},
      ...d.max !== void 0 ? { max: d.max } : {},
      ...d.step !== void 0 ? { step: d.step } : {},
      ...d.options !== void 0 ? { options: d.options } : {},
      ...d.default !== void 0 ? { default: d.default } : {},
      value: values[key]
    };
  });
}
function describeSceneObject(scene, id, src) {
  const o = scene.get(id);
  if (!o) return null;
  return {
    id,
    type: o.type,
    ...o.style.layer ? { layer: o.style.layer } : {},
    ...o.style.label ? { label: o.style.label } : {},
    ...o.pickTag ? { tag: o.pickTag } : {},
    ...typeof o.style.color === "string" ? { color: o.style.color } : {},
    ...o.key ? { key: o.key } : {},
    ...src ? { src } : {}
  };
}
function sceneSummary(scene, renderer, describe) {
  const groups = /* @__PURE__ */ new Map();
  const objects = [];
  const meshIssues = [];
  let meshesWithIssues = 0;
  let shown = 0;
  for (const o of scene.all()) {
    if (!renderer.isObjectShown(o.id)) continue;
    const b = renderer.objectBounds(o.id);
    if (!b) continue;
    shown++;
    const d = describe(o.id);
    if (o.mesh && typeof o.mesh.validate === "function") {
      const v = o.mesh.validate();
      if (!v.valid) {
        meshesWithIssues++;
        if (meshIssues.length < 20) meshIssues.push({ id: o.id, label: d.label, layer: d.layer, src: d.src, issues: v.issues });
      }
    }
    const key = [d.layer, d.label, d.type, d.src, d.color].join("|");
    let g = groups.get(key);
    if (!g) {
      g = { layer: d.layer, label: d.label, type: d.type, src: d.src, color: d.color, count: 0, ids: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      groups.set(key, g);
    }
    g.count++;
    if (g.ids.length < 10) g.ids.push(o.id);
    const lo = [b.min.x, b.min.y, b.min.z], hi = [b.max.x, b.max.y, b.max.z];
    for (let i = 0; i < 3; i++) {
      g.min[i] = Math.min(g.min[i], lo[i]);
      g.max[i] = Math.max(g.max[i], hi[i]);
    }
    if (objects.length < 150) objects.push({ ...d, bounds: [lo, hi].map((v) => v.map((n) => +n.toFixed(4))) });
  }
  const r4 = (v) => v.map((n) => +n.toFixed(4));
  const cam = renderer.cameraState();
  return {
    camera: { ...cam, position: r4(cam.position), target: r4(cam.target) },
    scene: {
      shownObjects: shown,
      meshesWithIssues,
      meshIssues,
      groups: [...groups.values()].map(({ min, max, ...g }) => ({ ...g, bounds: [r4(min), r4(max)] })),
      ...shown <= 150 ? { objects } : {}
    }
  };
}
function addOverlay(viewportEl, existing) {
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;inset:0;";
  (existing[existing.length - 1] ?? viewportEl).after(el);
  existing.push(el);
  return el;
}
function snapshotWithOverlays(renderer, wrap) {
  const base = renderer.snapshotPng();
  const shown = [...wrap.querySelectorAll("canvas[data-tekto-overlay]")].filter((c) => c.getClientRects().length > 0);
  if (!shown.length) return base;
  const src = renderer.canvasEl, r0 = src.getBoundingClientRect(), k = src.width / Math.max(1, r0.width);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const g = out.getContext("2d");
  g.drawImage(src, 0, 0);
  for (const c of shown) {
    const r = c.getBoundingClientRect();
    g.drawImage(c, (r.left - r0.left) * k, (r.top - r0.top) * k, r.width * k, r.height * k);
  }
  return out.toDataURL("image/png");
}
async function plainBundle(opts) {
  const markup = {
    format: "tekto-markup/1",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    sketch: { title: opts.title, url: location.href },
    harness: opts.harness,
    instruction: opts.note ?? "",
    viewport: { ...opts.viewport, dpr: window.devicePixelRatio || 1 },
    ...opts.context,
    marks: [],
    files: { view: "view.png", clean: "clean.png" }
  };
  const bundle = { markup, viewPng: opts.png, cleanPng: opts.png };
  if (opts.save !== false) bundle.dir = await saveBundle(bundle, opts.label ?? slug(opts.title));
  return bundle;
}
var ENDPOINT = "/__tekto/markup";
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sketch";
}
async function saveBundle(b, label) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, markup: b.markup, viewPng: b.viewPng, cleanPng: b.cleanPng })
    });
    if (res.ok) return (await res.json()).dir;
  } catch {
  }
  const dl = (name, href) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };
  dl(`${label}-view.png`, b.viewPng);
  dl(`${label}-clean.png`, b.cleanPng);
  dl(`${label}-markup.json`, URL.createObjectURL(new Blob([JSON.stringify(b.markup, null, 2)], { type: "application/json" })));
  return void 0;
}
function safeJson(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// src/sketch/Sketch2D.ts
function sketch2d(fn, config) {
  return new Sketch2DInstance(fn, config ?? {});
}
var Sketch2DInstance = class {
  constructor(fn, config) {
    // Param model: values in the ParamStore, placement in `items` — rendered
    // by the shared ControlPanel.
    this.store = new ParamStore({});
    this.items = /* @__PURE__ */ new Map();
    this.buttons = [];
    this.logs = [];
    this.bridge = null;
    this.drawFn = null;
    this.animateFn = null;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this.continuous = false;
    this._prevFingerprint = "";
    this._baseLogCount = 0;
    this._onceRan = [];
    this._onceSeq = 0;
    this.rng = createRandom();
    this.disposed = false;
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.rerunTimer = 0;
    this._running = false;
    // Input state
    this._mouseX = 0;
    this._mouseY = 0;
    this._mousePressed = false;
    this.fn = fn;
    this.config = config;
    if (typeof config.container === "string") {
      this.container = document.querySelector(config.container);
    } else if (config.container) {
      this.container = config.container;
    } else {
      this.container = document.body;
    }
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.buildDOM();
    this.wireInput();
    this.runSketch();
    this.startLoop();
    this.bridge = installAgentBridge({
      owner: this,
      harness: "sketch2d",
      store: this.store,
      snapshot: (opts) => plainBundle({
        ...opts,
        title: this.config.title ?? "sketch2d",
        harness: "sketch2d",
        png: this.canvas.toDataURL("image/png"),
        viewport: { width: this.canvas.clientWidth, height: this.canvas.clientHeight },
        context: {
          params: this.store.getAll(),
          // The body's lines plus this frame's: keep the latest value per label.
          logs: [...new Map(this.logs.map((l) => [l.label, { ...l }])).values()],
          errors: this.bridge?.errors() ?? []
        }
      })
    });
  }
  // ── DOM ──
  buildDOM() {
    const pw = this.config.panelWidth ?? 280;
    const t = getTheme(this.config.theme);
    const root = document.createElement("div");
    root.style.cssText = `
      display:grid; grid-template-columns:${pw}px 1fr; grid-template-rows:44px 1fr;
      height:100%; width:100%; overflow:hidden; position:relative;
      background:${t.bg}; color:${t.text};
      font-family:${t.font};
    `;
    const header = document.createElement("div");
    header.style.cssText = `
      grid-column:1/-1; display:flex; align-items:center; padding:0 16px; gap:12px;
      background:${t.panelBg}; border-bottom:1px solid ${t.border};
    `;
    header.innerHTML = `
      <span style="font-weight:600;font-size:14px;color:${t.accent}">
        &#x2B21; ${this.config.title ?? "Tekto Sketch2D"}
      </span>
      <span style="font-size:9px;padding:2px 6px;border-radius:3px;
        background:${t.hoverBg};color:${t.accent}">2D</span>
    `;
    root.appendChild(header);
    this.panelEl = document.createElement("div");
    this.panelEl.style.cssText = `
      grid-column:1; grid-row:2; overflow-y:auto; overflow-x:hidden; padding:0;
      background:${t.panelBg}; border-right:1px solid ${t.border};
    `;
    root.appendChild(this.panelEl);
    this.panel = new ControlPanel({
      store: this.store,
      theme: t,
      getButtons: () => this.buttons,
      onAction: () => this.scheduleRerun()
    });
    this.panelEl.appendChild(this.panel.el);
    this.store.onChange(() => this.scheduleRerun());
    const collapseKey = "tekto.sketch2d.collapsed";
    let collapsed = false;
    try {
      collapsed = localStorage.getItem(collapseKey) === "1";
    } catch {
    }
    const toggleBtn = document.createElement("button");
    toggleBtn.style.cssText = `
      margin-left:auto; cursor:pointer; width:28px; height:26px; border-radius:6px;
      border:1px solid ${t.border}; background:transparent; color:${t.text};
      font-size:15px; line-height:1; padding:0; flex:none;
    `;
    const applyCollapse = () => {
      root.style.gridTemplateColumns = collapsed ? "0 1fr" : `${pw}px 1fr`;
      this.panelEl.style.display = collapsed ? "none" : "";
      toggleBtn.textContent = collapsed ? "\u203A" : "\u2039";
      toggleBtn.title = collapsed ? "Show controls" : "Hide controls";
    };
    toggleBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      try {
        localStorage.setItem(collapseKey, collapsed ? "1" : "0");
      } catch {
      }
      applyCollapse();
      this.resizeCanvas();
    });
    header.appendChild(toggleBtn);
    const vpWrap = document.createElement("div");
    vpWrap.style.cssText = "grid-column:2;grid-row:2;position:relative;overflow:hidden;";
    this.canvas.style.cssText = `
      width:100%; height:100%; display:block;
      background:${this.config.background ?? (t.isDark ? "#0a0a10" : "#ffffff")};
    `;
    vpWrap.appendChild(this.canvas);
    this.logEl = document.createElement("div");
    this.logEl.style.cssText = `
      position:absolute; bottom:12px; left:12px;
      padding:8px 12px; border-radius:6px;
      background:rgba(7,8,14,.85); backdrop-filter:blur(8px);
      font-size:11px; line-height:1.7; color:${t.textDim};
      pointer-events:none; max-width:300px;
      border:1px solid rgba(22,24,42,.8); display:none;
    `;
    vpWrap.appendChild(this.logEl);
    root.appendChild(vpWrap);
    if (this.container === document.body) {
      this.container.style.margin = "0";
      this.container.style.height = "100vh";
      this.container.style.overflow = "hidden";
    }
    this.container.appendChild(root);
    applyCollapse();
    const ro = new ResizeObserver(() => this.resizeCanvas());
    ro.observe(vpWrap);
    this.resizeCanvas();
  }
  resizeCanvas() {
    const parent = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.redraw();
    }
  }
  wireInput() {
    this.canvas.style.touchAction = "none";
    const sample = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, id: e.pointerId };
    };
    this.canvas.addEventListener("pointerdown", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = true;
      for (const fn of this.pointerDownFns) fn(p);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      for (const fn of this.pointerMoveFns) fn(p);
    });
    const onUp = (e) => {
      const p = sample(e);
      this._mouseX = p.x;
      this._mouseY = p.y;
      this._mousePressed = false;
      for (const fn of this.pointerUpFns) fn(p);
    };
    this.canvas.addEventListener("pointerup", onUp);
    this.canvas.addEventListener("pointercancel", onUp);
  }
  // ── Sketch execution ──
  runSketch() {
    this.buttons = [];
    this.logs = [];
    this.drawFn = null;
    this.animateFn = null;
    this.continuous = false;
    this.pointerDownFns = [];
    this.pointerMoveFns = [];
    this.pointerUpFns = [];
    this._onceSeq = 0;
    const usedParams = /* @__PURE__ */ new Set();
    const lab = this.buildLab(usedParams);
    this._running = true;
    try {
      this.fn(lab);
    } catch (e) {
      console.error("Sketch2D error:", e);
      this.logs.push({ label: "ERROR", value: String(e) });
    }
    this._running = false;
    for (const key of this.store.keys()) {
      if (!usedParams.has(key)) {
        this.store.remove(key);
        this.items.delete(key);
      }
    }
    const fingerprint = [...this.items.keys()].sort().join("|") + "\u2016" + this.buttons.map((b) => `${b.group}:${b.label}`).join("|");
    if (fingerprint !== this._prevFingerprint) {
      this._prevFingerprint = fingerprint;
      this.panel.render([...this.items.values()]);
    }
    this._baseLogCount = this.logs.length;
    this.updateLog();
    this.redraw();
  }
  redraw() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w > 0 && h > 0 && this.drawFn) {
      this.ctx.save();
      this.drawFn(this.ctx, w, h);
      this.ctx.restore();
    }
  }
  scheduleRerun() {
    if (this._running || this.rerunTimer) return;
    this.rerunTimer = requestAnimationFrame(() => {
      this.rerunTimer = 0;
      this.runSketch();
    });
  }
  buildLab(usedParams) {
    const self = this;
    function makeParam(key, def, item) {
      usedParams.add(key);
      if (!self.store.has(key)) {
        self.store.define(key, def);
        self.items.set(key, item);
      }
      return { get value() {
        return self.store.get(key);
      }, set(v) {
        self.store.set(key, v);
      } };
    }
    return {
      slider(label, min, max, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `slider:${opts?.group ?? ""}:${label}`;
        return makeParam(
          key,
          { type: "float", min, max, default: def, step: opts?.step ?? (max - min) / 100, label },
          { key, group }
        );
      },
      toggle(label, def = false, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `toggle:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "bool", default: def, label }, { key, group });
      },
      select(label, options, def, opts) {
        const group = opts?.group ?? "Parameters";
        const key = `select:${opts?.group ?? ""}:${label}`;
        return makeParam(
          key,
          { type: "select", options, default: def ?? options[0], label },
          { key, group }
        );
      },
      colorPicker(label, def = "#38d9a9", opts) {
        const group = opts?.group ?? "Display";
        const key = `color:${opts?.group ?? ""}:${label}`;
        return makeParam(key, { type: "color", default: def, label }, { key, group });
      },
      button(label, action, opts) {
        self.buttons.push({ label, action, group: opts?.group ?? "Actions" });
      },
      draw(fn) {
        self.drawFn = fn;
      },
      animate(fn) {
        self.animateFn = fn;
        self.continuous = true;
      },
      once(fn) {
        const i = self._onceSeq++;
        if (!self._onceRan[i]) {
          self._onceRan[i] = true;
          fn();
        }
      },
      get canvas() {
        return self.canvas;
      },
      get ctx() {
        return self.ctx;
      },
      get width() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.width / dpr;
      },
      get height() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        return self.canvas.height / dpr;
      },
      get dpr() {
        return Math.min(window.devicePixelRatio, 2);
      },
      log(label, value) {
        self.logs.push({ label, value: value != null ? String(value) : "" });
      },
      // Math
      vec2: (x, y) => new Vec2(x, y),
      PI: Math.PI,
      TWO_PI: Math.PI * 2,
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      sqrt: Math.sqrt,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      lerp: MathUtils.lerp,
      clamp: MathUtils.clamp,
      noise(x, y, z) {
        return noise(x, y ?? 0, z ?? 0);
      },
      random(min, max) {
        return self.rng.random(min, max);
      },
      randomSeed(seed) {
        self.rng = createRandom(seed);
      },
      // Input
      get mouseX() {
        return self._mouseX;
      },
      get mouseY() {
        return self._mouseY;
      },
      get mousePressed() {
        return self._mousePressed;
      },
      onPointerDown(fn) {
        self.pointerDownFns.push(fn);
      },
      onPointerMove(fn) {
        self.pointerMoveFns.push(fn);
      },
      onPointerUp(fn) {
        self.pointerUpFns.push(fn);
      }
    };
  }
  updateLog() {
    if (this.logs.length === 0) {
      this.logEl.style.display = "none";
      return;
    }
    this.logEl.style.display = "block";
    this.logEl.innerHTML = this.logs.map(
      (l) => `<div style="display:flex;gap:8px;"><span style="color:#4a5070">${l.label}</span><span style="color:#b8bdd4">${l.value}</span></div>`
    ).join("");
  }
  // ── Animation Loop ──
  startLoop() {
    const loop = () => {
      if (this.disposed) return;
      if (this.continuous && this.animateFn) {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1e3;
        this.lastTime = now;
        this.logs.length = this._baseLogCount;
        this.animateFn((now - this.startTime) / 1e3, Math.min(dt, 1 / 15));
        this.redraw();
        this.updateLog();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  /** The current value of every control, keyed for `setParams` — save it to reopen a design. */
  getParams() {
    return { ...this.store.getAll() };
  }
  /** Set controls by label, "Group:Label" or key, and re-run once; reports what it couldn't apply. */
  setParams(values) {
    return this.store.setByName(values);
  }
  /** Tear down the sketch */
  dispose() {
    this.disposed = true;
    this.bridge?.dispose();
    this.panel.dispose();
    this.container.innerHTML = "";
  }
};

// src/render/SheetCanvas.ts
var FONT = "Helvetica, Arial, sans-serif";
var MIN_PEN_PX = 0.75;
var HIGHLIGHT = "#1e88e5";
function fitSheet(bounds, width, height, margin = 24) {
  if (!bounds) return { scale: 1, x: width / 2, y: height / 2 };
  const bw = Math.max(bounds.max.x - bounds.min.x, 1e-9), bh = Math.max(bounds.max.y - bounds.min.y, 1e-9);
  const scale = Math.max(1e-9, Math.min((width - 2 * margin) / bw, (height - 2 * margin) / bh));
  const cx = (bounds.min.x + bounds.max.x) / 2, cy = (bounds.min.y + bounds.max.y) / 2;
  return { scale, x: width / 2 - cx * scale, y: height / 2 + cy * scale };
}
function drawSheet(ctx, sheet, t, opts = {}) {
  const prims = opts.prims ?? sheet.explode();
  const hl = opts.highlight ? new Set(opts.highlight) : null;
  const hlColor = opts.highlightColor ?? HIGHLIGHT;
  const mmPx = sheet.scale / 1e3 * t.scale;
  const X = (p) => t.x + p.x * t.scale, Y = (p) => t.y - p.y * t.scale;
  const pen = (s, lit) => {
    ctx.strokeStyle = lit ? hlColor : s.color;
    ctx.lineWidth = Math.max(MIN_PEN_PX, s.weight * mmPx) + (lit ? 1.5 : 0);
    ctx.setLineDash(s.dash === "solid" ? [] : DASH_PATTERNS[s.dash].map((d) => Math.max(d * mmPx, 0.5)));
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of prims) {
    const lit = !!(hl && p.key && hl.has(p.key));
    if (p.kind === "fill") {
      ctx.beginPath();
      for (const r of p.rings) r.forEach((q, i) => i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)));
      ctx.fillStyle = p.color;
      ctx.fill("evenodd");
      if (lit) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = hlColor;
        ctx.fill("evenodd");
        ctx.globalAlpha = 1;
      }
    } else if (p.kind === "polyline") {
      pen(p.style, lit);
      ctx.beginPath();
      p.points.forEach((q, i) => i ? ctx.lineTo(X(q), Y(q)) : ctx.moveTo(X(q), Y(q)));
      if (p.closed) ctx.closePath();
      ctx.stroke();
    } else if (p.kind === "circle") {
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "arc") {
      let sweep = (p.endDeg - p.startDeg) % 360;
      if (sweep <= 0) sweep += 360;
      const a0 = -p.startDeg * Math.PI / 180, a1 = -(p.startDeg + sweep) * Math.PI / 180;
      pen(p.style, lit);
      ctx.beginPath();
      ctx.arc(X(p.center), Y(p.center), p.radius * t.scale, a0, a1, true);
      ctx.stroke();
    } else {
      const px = p.height * t.scale;
      if (px < 0.5) continue;
      ctx.save();
      ctx.translate(X(p.at), Y(p.at));
      if (p.rotation) ctx.rotate(-p.rotation * Math.PI / 180);
      ctx.font = `${px}px ${FONT}`;
      ctx.fillStyle = lit ? hlColor : p.style.color;
      ctx.textAlign = p.align;
      ctx.textBaseline = p.baseline === "bottom" ? "alphabetic" : p.baseline === "middle" ? "middle" : "hanging";
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}
var SheetCanvas = class {
  constructor(container, opts = {}) {
    this._sheet = null;
    this.prims = [];
    this.t = { scale: 1, x: 0, y: 0 };
    this.fitted = false;
    this.highlight = [];
    this.pickFns = [];
    this.drawFns = [];
    this.frame = 0;
    this.opts = opts;
    this.canvas = document.createElement("canvas");
    this.canvas.dataset.tektoOverlay = "";
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;";
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.off = this.wire();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    if (opts.sheet) this.setSheet(opts.sheet);
  }
  get sheet() {
    return this._sheet;
  }
  /** The primitives on screen (the sheet, exploded once per `setSheet`). */
  get primitives() {
    return this.prims;
  }
  get transform() {
    return { ...this.t };
  }
  /** Show a sheet. The first one is fitted; later ones keep the zoom, so a sheet rebuilt on
   *  every edit stays put (`fit: true` to refit). */
  setSheet(sheet, opts = {}) {
    this._sheet = sheet;
    this.prims = sheet ? sheet.explode() : [];
    if (opts.fit || !this.fitted) this.fit();
    else this.redraw();
  }
  setTransform(t) {
    this.t = { ...t };
    this.redraw();
  }
  fit() {
    const { width, height } = this.size();
    if (!this._sheet || !width || !height) {
      this.redraw();
      return;
    }
    this.t = fitSheet(boundsOf(this.prims), width, height, this.opts.margin ?? 24);
    this.fitted = true;
    this.redraw();
  }
  toSheet(x, y) {
    return { x: (x - this.t.x) / this.t.scale, y: (this.t.y - y) / this.t.scale };
  }
  toScreen(p) {
    return { x: this.t.x + p.x * this.t.scale, y: this.t.y - p.y * this.t.scale };
  }
  /** The primitive at a canvas position (CSS pixels), or null. */
  pick(x, y) {
    return pickPrim(this.prims, this.toSheet(x, y), (this.opts.pickTolerance ?? 6) / this.t.scale);
  }
  /** Clicks (not drags): the picked primitive, or null for paper. Returns the unsubscribe. */
  onPick(fn) {
    this.pickFns.push(fn);
    return () => {
      this.pickFns = this.pickFns.filter((f) => f !== fn);
    };
  }
  /** Draw primitives with these keys highlighted (a selection); null clears. */
  setHighlight(keys) {
    this.highlight = keys ? [...keys] : [];
    this.redraw();
  }
  /** Paint over the sheet in screen pixels after every redraw. Returns the unsubscribe. */
  onDraw(fn) {
    this.drawFns.push(fn);
    this.redraw();
    return () => {
      this.drawFns = this.drawFns.filter((f) => f !== fn);
      this.redraw();
    };
  }
  /** Redraw on the next frame (calls coalesce). */
  redraw() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }
  /** Draw now — before reading the canvas back. */
  paint() {
    const { width, height, dpr } = this.size();
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const bg = this.opts.background ?? "#ffffff";
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
    if (this._sheet) drawSheet(ctx, this._sheet, this.t, { prims: this.prims, highlight: this.highlight, highlightColor: this.opts.highlightColor });
    for (const fn of this.drawFns) {
      ctx.save();
      fn(ctx, this.transform);
      ctx.restore();
    }
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.off();
    this.canvas.remove();
  }
  size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { width: this.canvas.clientWidth, height: this.canvas.clientHeight, dpr };
  }
  resize() {
    const { width, height, dpr } = this.size();
    if (!width || !height) return;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    if (!this.fitted && this._sheet) this.fit();
    else this.paint();
  }
  wire() {
    const c = this.canvas;
    const local = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onWheel = (e) => {
      e.preventDefault();
      const p = local(e), k = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 15e-4));
      this.t = { scale: this.t.scale * k, x: p.x - (p.x - this.t.x) * k, y: p.y - (p.y - this.t.y) * k };
      this.redraw();
    };
    let drag = null;
    const onDown = (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      const p = local(e);
      drag = { id: e.pointerId, x: p.x, y: p.y, t: { ...this.t }, moved: false };
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = local(e);
      if (!drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) < 4) return;
      drag.moved = true;
      this.t = { ...drag.t, x: drag.t.x + p.x - drag.x, y: drag.t.y + p.y - drag.y };
      this.redraw();
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasClick = !drag.moved && e.button === 0;
      drag = null;
      if (!wasClick) return;
      const p = local(e), prim = this.pick(p.x, p.y);
      for (const fn of this.pickFns) fn(prim, { shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
    };
    const onCancel = () => {
      drag = null;
    };
    const onDbl = () => this.fit();
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onCancel);
    c.addEventListener("dblclick", onDbl);
    return () => {
      c.removeEventListener("wheel", onWheel);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onCancel);
      c.removeEventListener("dblclick", onDbl);
    };
  }
};

export {
  getTheme,
  ControlPanel,
  installAgentBridge,
  describeSceneObject,
  sceneSummary,
  addOverlay,
  snapshotWithOverlays,
  plainBundle,
  slug,
  saveBundle,
  sketch2d,
  Sketch2DInstance,
  fitSheet,
  drawSheet,
  SheetCanvas
};
