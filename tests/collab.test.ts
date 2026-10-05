import { describe, expect, it } from "vitest";

import { SharedStore, memoryAdapter, collabColor } from "../src";
import type { CollabAdapter } from "../src";

const tick = () => new Promise((r) => setTimeout(r, 0));

async function pair() {
  const backend = memoryAdapter();
  const a = new SharedStore<number>({ doc: "d", adapter: backend.withUser({ id: "ann", name: "Ann" }) });
  const b = new SharedStore<number>({ doc: "d", adapter: backend.withUser({ id: "bob", name: "Bob" }) });
  await a.connect(); await b.connect();
  return { a, b };
}

describe("SharedStore", () => {
  it("applies a write locally at once and shares it", async () => {
    const { a, b } = await pair();
    a.set("k", 1);
    expect(a.get("k")).toBe(1);
    await tick();
    expect(b.get("k")).toBe(1);
    expect(b.meta("k")?.by).toBe("ann");
  });

  it("loads what is already stored", async () => {
    const backend = memoryAdapter();
    const a = new SharedStore<number>({ doc: "d", adapter: backend });
    await a.connect();
    a.set("x", 7); await tick();
    const late = new SharedStore<number>({ doc: "d", adapter: backend });
    await late.connect();
    expect(late.get("x")).toBe(7);
  });

  it("removes a key with delete (entries leave it out)", async () => {
    const { a, b } = await pair();
    a.set("k", 1); await tick();
    b.delete("k"); await tick();
    expect(a.get("k")).toBeUndefined();
    expect(a.entries()).toEqual([]);
  });

  it("ends with the same value everywhere when two write one key (last write wins)", async () => {
    const { a, b } = await pair();
    a.set("k", 1);
    b.set("k", 2);
    await tick(); await tick();
    expect(a.get("k")).toBe(2);
    expect(b.get("k")).toBe(2);
  });

  it("keeps a newer remote write that arrives while its own write is unconfirmed", async () => {
    // A backend whose put answers only when released: Bob's newer record reaches Ann first.
    const backend = memoryAdapter();
    let release!: () => void;
    const slow: CollabAdapter = {
      ...backend.withUser({ id: "ann", name: "Ann" }),
      async put(doc, key, value) {
        const stored = await backend.withUser({ id: "ann", name: "Ann" }).put(doc, key, value);
        await new Promise<void>((r) => { release = r; });
        return stored;
      },
    };
    const a = new SharedStore<number>({ doc: "d", adapter: slow });
    const b = new SharedStore<number>({ doc: "d", adapter: backend.withUser({ id: "bob", name: "Bob" }) });
    await a.connect(); await b.connect();
    a.set("k", 1);
    await tick();
    b.set("k", 2);            // stored after Ann's, so it wins
    await tick();
    expect(a.get("k")).toBe(1);   // Ann's own write is still pending: Bob's waits
    release(); await tick();
    expect(a.get("k")).toBe(2);
    expect(b.get("k")).toBe(2);
  });

  it("puts the stored value back when the backend refuses a write", async () => {
    const backend = memoryAdapter();
    const ok = backend.withUser({ id: "ann", name: "Ann" });
    const a = new SharedStore<number>({ doc: "d", adapter: ok });
    await a.connect();
    a.set("k", 1); await tick();
    const refusing: CollabAdapter = { ...ok, put: () => Promise.reject(new Error("not an editor")) };
    const c = new SharedStore<number>({ doc: "d", adapter: refusing });
    await c.connect();
    const errors: string[] = [];
    c.onError((key, msg) => errors.push(`${key}: ${msg}`));
    c.set("k", 5);
    expect(c.get("k")).toBe(5);
    await tick();
    expect(c.get("k")).toBe(1);
    expect(errors).toEqual(["k: not an editor"]);
  });

  it("shares presence and broadcasts (not stored)", async () => {
    const { a, b } = await pair();
    a.setPresence({ selected: "ch1" });
    await tick();
    const ann = b.others.find((p) => p.user.id === "ann");
    expect(ann?.state.selected).toBe("ch1");
    expect(ann?.color).toBe(collabColor("ann"));
    const got: [string, unknown][] = [];
    const own: unknown[] = [];
    b.onBroadcast((e, p) => got.push([e, p]));
    a.onBroadcast((e, p) => own.push(p));
    a.broadcast("drag", { x: 1 });
    await tick();
    expect(got).toEqual([["drag", { x: 1 }]]);
    expect(own).toEqual([]);
    expect(b.entries()).toEqual([]);
  });

  it("drops a client's presence when it disconnects", async () => {
    const { a, b } = await pair();
    a.setPresence({}); b.setPresence({});
    await tick();
    expect(a.presence.length).toBe(2);
    b.disconnect();
    await tick();
    expect(a.presence.map((p) => p.user.id)).toEqual(["ann"]);
  });

  it("reports changes with their source", async () => {
    const { a, b } = await pair();
    const seen: string[] = [];
    a.onChange((keys, src) => seen.push(`a:${keys.join()}:${src}`));
    b.onChange((keys, src) => seen.push(`b:${keys.join()}:${src}`));
    a.set("k", 3); await tick();
    expect(seen).toContain("a:k:local");
    expect(seen).toContain("b:k:remote");
    expect(b.meta("k")?.at).toBeGreaterThan(0);
  });
});
