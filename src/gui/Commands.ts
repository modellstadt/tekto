/**
 * Commands — what a user (or an agent) can do in an app, with the keys that do it.
 *
 * Every app grew its own `keydown` handler: a chain of `if (mod && key === "z")` that no one
 * else could see. A command names the action once — an id, a label, the keys, how to run it,
 * and whether it can run now — and the registry does the rest: runs it from its keys (not
 * while typing in a field), lists it for a palette or a tooltip, and lets an agent run it
 * by id (`window.__tekto.run("edit.undo")`).
 *
 *   app.commands.add([
 *     { id: "edit.undo", label: "Undo", keys: "Mod+Z", run: () => doc.undo(), enabled: () => doc.canUndo() },
 *     { id: "edit.delete", label: "Delete", keys: ["Delete", "Backspace"], run: removeSelected },
 *   ]);
 *
 * Keys: modifiers then the key, joined by "+": `Mod` is ⌘ on a Mac and Ctrl elsewhere (or
 * name `Meta` / `Ctrl` outright), then `Shift`, `Alt`; the key is a `KeyboardEvent.key` —
 * a letter, `Delete`, `Escape`, `ArrowUp`, `F`, `?`.
 */

import type { StandardView } from "../scene/Scene";

/** Something the app can do. */
export interface Command {
  /** Stable name, dotted by area: `"edit.undo"`, `"view.top"`. */
  id: string;
  /** What a person reads: `"Undo"`. */
  label: string;
  /** Key bindings: `"Mod+Z"`, or several (`["Delete", "Backspace"]`). */
  keys?: string | readonly string[];
  /** Where it belongs in a list: `"Edit"`, `"View"`. */
  group?: string;
  run(): void | Promise<void>;
  /** Whether it can run now; keys and `run(id)` skip it when false. */
  enabled?(): boolean;
}

/** A command as listed: everything but the functions. */
export interface CommandInfo {
  id: string;
  label: string;
  group?: string;
  keys: string[];
  enabled: boolean;
}

const isMacPlatform = (): boolean =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");

/** Does this key event press this binding? Exactly its modifiers; letters ignore case. */
export function keyMatches(binding: string, e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">, mac = isMacPlatform()): boolean {
  const parts = binding.split("+").map(s => s.trim()).filter(Boolean);
  // "Shift++" (the plus key) leaves an empty last part: take the raw tail.
  const key = binding.endsWith("++") ? "+" : parts.pop();
  if (!key) return false;
  const want = { meta: false, ctrl: false, alt: false, shift: false };
  for (const m of parts) {
    const k = m.toLowerCase();
    if (k === "mod") (mac ? (want.meta = true) : (want.ctrl = true));
    else if (k === "meta" || k === "cmd") want.meta = true;
    else if (k === "ctrl" || k === "control") want.ctrl = true;
    else if (k === "alt" || k === "option") want.alt = true;
    else if (k === "shift") want.shift = true;
  }
  if (e.metaKey !== want.meta || e.ctrlKey !== want.ctrl || e.altKey !== want.alt) return false;
  // Shift changes what a symbol key reports ("?" is Shift+/), so only hold letters and named
  // keys to it; a binding of "?" matches however the layout produces it.
  const letterOrNamed = key.length > 1 || /^[a-z0-9]$/i.test(key);
  if (letterOrNamed && e.shiftKey !== want.shift) return false;
  return e.key.length === 1 ? e.key.toLowerCase() === key.toLowerCase() : e.key === key;
}

/** A binding the way the platform writes it: "⇧⌘Z" on a Mac, "Ctrl+Shift+Z" elsewhere. */
export function formatKeys(binding: string, mac = isMacPlatform()): string {
  const parts = binding.split("+").map(s => s.trim()).filter(Boolean);
  const key = binding.endsWith("++") ? "+" : parts.pop() ?? "";
  const has = (...names: string[]) => parts.some(p => names.includes(p.toLowerCase()));
  const named: Record<string, string> = mac
    ? { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Delete: "⌦", Backspace: "⌫", Escape: "⎋", Enter: "↩" }
    : { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc" };
  const k = named[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  if (mac) {
    return (has("ctrl", "control") ? "⌃" : "") + (has("alt", "option") ? "⌥" : "") + (has("shift") ? "⇧" : "")
      + (has("mod", "meta", "cmd") ? "⌘" : "") + k;
  }
  const mods = [has("mod", "ctrl", "control") && "Ctrl", has("meta", "cmd") && "Win", has("alt", "option") && "Alt", has("shift") && "Shift"].filter(Boolean);
  return [...mods, k].join("+");
}

/** Is the user typing (so a key belongs to the field, not to a command)? */
function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

/** What `viewCommands` drives: structurally a ThreeRenderer. */
export interface ViewControl {
  fitAll(): void;
  setView(view: StandardView): void;
  setProjection(projection: "perspective" | "orthographic"): void;
  readonly projection: "perspective" | "orthographic";
}

/**
 * The commands every 3D view has — frame everything, the plan, the elevations, iso, the
 * projection — so a palette lists them and an agent can run them (`__tekto.run("view.top")`).
 * No keys: which keys mean what is the app's to decide.
 */
export function viewCommands(view: ViewControl): Command[] {
  const v = (id: StandardView, label: string): Command => ({ id: `view.${id}`, label, group: "View", run: () => view.setView(id) });
  return [
    { id: "view.fitAll", label: "Frame all", group: "View", run: () => view.fitAll() },
    v("top", "Plan (top)"), v("front", "Front"), v("right", "Right"), v("back", "Back"), v("left", "Left"), v("iso", "Iso"),
    {
      id: "view.toggleProjection", label: "Perspective / orthographic", group: "View",
      run: () => view.setProjection(view.projection === "perspective" ? "orthographic" : "perspective"),
    },
  ];
}

/** The commands of one app: run by key or by id, listed for people and agents. */
export class Commands {
  private byId = new Map<string, Command>();
  private listeners = new Set<() => void>();

  /** Add commands (an id already there is replaced). Returns a function that removes them. */
  add(commands: Command | readonly Command[]): () => void {
    const list = Array.isArray(commands) ? commands : [commands as Command];
    for (const c of list) {
      if (!c.id || typeof c.run !== "function") throw new Error(`Commands.add: a command needs an id and run(), got ${JSON.stringify(c)}`);
      this.byId.set(c.id, c);
    }
    this.emit();
    return () => { for (const c of list) if (this.byId.get(c.id) === c) this.byId.delete(c.id); this.emit(); };
  }

  remove(id: string): void { if (this.byId.delete(id)) this.emit(); }
  get(id: string): Command | undefined { return this.byId.get(id); }
  has(id: string): boolean { return this.byId.has(id); }

  /** Every command, in the order added, with its keys and whether it can run now. */
  list(): CommandInfo[] {
    return [...this.byId.values()].map(c => ({
      id: c.id, label: c.label, group: c.group,
      keys: c.keys === undefined ? [] : typeof c.keys === "string" ? [c.keys] : [...c.keys],
      enabled: this.canRun(c),
    }));
  }

  /** Run a command by id. False if there is none or it can't run now. */
  async run(id: string): Promise<boolean> {
    const c = this.byId.get(id);
    if (!c || !this.canRun(c)) return false;
    await c.run();
    return true;
  }

  /** The command a key event presses, if any (and enabled). */
  match(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">, mac?: boolean): Command | undefined {
    for (const c of this.byId.values()) {
      const keys = c.keys === undefined ? [] : typeof c.keys === "string" ? [c.keys] : c.keys;
      if (keys.some(k => keyMatches(k, e, mac)) && this.canRun(c)) return c;
    }
    return undefined;
  }

  /**
   * Run commands from their keys on `target` (default: the window). Keys typed into a
   * field stay with the field; a matched key's default is prevented. Returns the unbind.
   */
  bindKeys(target: Pick<Window, "addEventListener" | "removeEventListener"> = window): () => void {
    const onKey = (ev: Event) => {
      const e = ev as KeyboardEvent;
      if (e.defaultPrevented || typing(e.target)) return;
      const c = this.match(e);
      if (!c) return;
      e.preventDefault();
      void Promise.resolve(c.run()).catch((err) => console.error(`command ${c.id}:`, err));
    };
    target.addEventListener("keydown", onKey);
    return () => target.removeEventListener("keydown", onKey);
  }

  /** Hear when commands are added or removed. Returns the unsubscribe. */
  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private canRun(c: Command): boolean {
    try { return c.enabled ? c.enabled() !== false : true; } catch { return false; }
  }

  private emit(): void { for (const l of this.listeners) l(); }
}
