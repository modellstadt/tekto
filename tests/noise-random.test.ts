import { describe, it, expect } from "vitest";
import { noise } from "../src/core/math/noise";
import { createRandom } from "../src/core/math/random";

describe("Perlin Noise", () => {
  it("returns values in [0, 1]", () => {
    for (let i = 0; i < 100; i++) {
      const v = noise(i * 0.1, i * 0.2, i * 0.3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic (same input → same output)", () => {
    expect(noise(1.5, 2.3, 0.7)).toBe(noise(1.5, 2.3, 0.7));
  });

  it("varies smoothly (nearby inputs give nearby outputs)", () => {
    const a = noise(1.0, 0, 0);
    const b = noise(1.01, 0, 0);
    expect(Math.abs(a - b)).toBeLessThan(0.1);
  });

  it("1D noise works", () => {
    const v = noise(3.14);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it("2D noise works", () => {
    const v = noise(1.5, 2.5);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe("Seeded Random", () => {
  it("returns values in [0, 1)", () => {
    const rng = createRandom(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic with same seed", () => {
    const a = createRandom(123);
    const b = createRandom(123);
    for (let i = 0; i < 10; i++) {
      expect(a.random()).toBe(b.random());
    }
  });

  it("different seeds give different sequences", () => {
    const a = createRandom(1);
    const b = createRandom(2);
    // At least one of the first 5 values should differ
    let allSame = true;
    for (let i = 0; i < 5; i++) {
      if (a.random() !== b.random()) allSame = false;
    }
    expect(allSame).toBe(false);
  });

  it("random(max) returns [0, max)", () => {
    const rng = createRandom(42);
    for (let i = 0; i < 50; i++) {
      const v = rng.random(5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
    }
  });

  it("random(min, max) returns [min, max)", () => {
    const rng = createRandom(42);
    for (let i = 0; i < 50; i++) {
      const v = rng.random(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(7);
    }
  });

  it("randomSeed resets the sequence", () => {
    const rng = createRandom(42);
    const first = rng.random();
    rng.randomSeed(42);
    expect(rng.random()).toBe(first);
  });
});
