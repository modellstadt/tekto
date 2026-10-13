/**
 * Commands: keys that mean the same on a Mac and elsewhere, exact modifiers, nothing run
 * while typing, run by id for agents, listed with whether each can run now.
 */
import { describe, it, expect } from "vitest";
import { Commands, keyMatches, formatKeys } from "../src/gui/Commands";

const key = (k: string, mods: Partial<{ meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }> = {}) =>
  ({ key: k, metaKey: !!mods.meta, ctrlKey: !!mods.ctrl, altKey: !!mods.alt, shiftKey: !!mods.shift });

describe("keyMatches", () => {
  it("Mod is ⌘ on a Mac and Ctrl elsewhere", () => {
    expect(keyMatches("Mod+Z", key("z", { meta: true }), true)).toBe(true);
    expect(keyMatches("Mod+Z", key("z", { ctrl: true }), true)).toBe(false);
    expect(keyMatches("Mod+Z", key("z", { ctrl: true }), false)).toBe(true);
  });

  it("modifiers are exact, so Undo isn't also Redo", () => {
    expect(keyMatches("Mod+Z", key("Z", { meta: true, shift: true }), true)).toBe(false);
    expect(keyMatches("Shift+Mod+Z", key("Z", { meta: true, shift: true }), true)).toBe(true);
    expect(keyMatches("Delete", key("Delete", { alt: true }))).toBe(false);
  });

  it("named keys, letters in either case, symbols however the layout makes them", () => {
    expect(keyMatches("ArrowUp", key("ArrowUp"))).toBe(true);
    expect(keyMatches("f", key("F", { shift: false }))).toBe(true);
    expect(keyMatches("?", key("?", { shift: true }))).toBe(true);     // Shift+/ on most layouts
    expect(keyMatches("Shift++", key("+", { shift: true }))).toBe(true);
  });
});

describe("formatKeys", () => {
  it("writes bindings the way each platform does", () => {
    expect(formatKeys("Shift+Mod+Z", true)).toBe("⇧⌘Z");
    expect(formatKeys("Shift+Mod+Z", false)).toBe("Ctrl+Shift+Z");
    expect(formatKeys("ArrowLeft", false)).toBe("←");
    expect(formatKeys("Delete", true)).toBe("⌦");
  });
});

describe("Commands", () => {
  it("runs by id, skips what can't run, lists what there is", async () => {
    const c = new Commands();
    let undone = 0, canUndo = false;
    c.add([
      { id: "edit.undo", label: "Undo", keys: "Mod+Z", group: "Edit", run: () => { undone++; }, enabled: () => canUndo },
      { id: "view.fit", label: "Fit", run: () => {} },
    ]);
    expect(await c.run("edit.undo")).toBe(false);
    canUndo = true;
    expect(await c.run("edit.undo")).toBe(true);
    expect(undone).toBe(1);
    expect(await c.run("nope")).toBe(false);
    expect(c.list()).toEqual([
      { id: "edit.undo", label: "Undo", group: "Edit", keys: ["Mod+Z"], enabled: true },
      { id: "view.fit", label: "Fit", group: undefined, keys: [], enabled: true },
    ]);
  });

  it("keys run their command, but not while typing in a field", () => {
    const c = new Commands();
    let deleted = 0;
    c.add({ id: "edit.delete", label: "Delete", keys: ["Delete", "Backspace"], run: () => { deleted++; } });
    const handlers: ((e: Event) => void)[] = [];
    const target = { addEventListener: (_: string, h: (e: Event) => void) => handlers.push(h), removeEventListener: () => {} };
    c.bindKeys(target as unknown as Window);
    const fire = (k: string, tagName = "CANVAS") => {
      let prevented = false;
      handlers[0]({ ...key(k), target: { tagName }, defaultPrevented: false, preventDefault: () => { prevented = true; } } as unknown as Event);
      return prevented;
    };
    expect(fire("Backspace")).toBe(true);
    expect(fire("Backspace", "INPUT")).toBe(false);
    expect(fire("x")).toBe(false);
    expect(deleted).toBe(1);
  });

  it("removing returns the registry to what it was; a bad command fails loudly", () => {
    const c = new Commands();
    const off = c.add({ id: "a", label: "A", run: () => {} });
    let changes = 0;
    c.onChange(() => changes++);
    off();
    expect(c.has("a")).toBe(false);
    expect(changes).toBe(1);
    expect(() => c.add({ id: "", label: "x" } as never)).toThrow(/needs an id and run/);
  });
});
