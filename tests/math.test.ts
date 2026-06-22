import { describe, it, expect } from "vitest";
import { Vec2, Vec3, Vec4, Mat4, MathUtils } from "../src/core/math/vectors";

describe("Vec3", () => {
  it("creates from components", () => {
    const v = new Vec3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  it("adds vectors", () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);
    const c = a.add(b);
    expect(c.x).toBe(5);
    expect(c.y).toBe(7);
    expect(c.z).toBe(9);
  });

  it("computes cross product", () => {
    const x = Vec3.unitX();
    const y = Vec3.unitY();
    const z = x.cross(y);
    expect(z.x).toBeCloseTo(0);
    expect(z.y).toBeCloseTo(0);
    expect(z.z).toBeCloseTo(1);
  });

  it("computes dot product", () => {
    const a = new Vec3(1, 0, 0);
    const b = new Vec3(0, 1, 0);
    expect(a.dot(b)).toBeCloseTo(0);
    expect(a.dot(a)).toBeCloseTo(1);
  });

  it("normalizes", () => {
    const v = new Vec3(3, 0, 4);
    const n = v.normalize();
    expect(n.len()).toBeCloseTo(1);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.z).toBeCloseTo(0.8);
  });

  it("lerps", () => {
    const a = new Vec3(0, 0, 0);
    const b = new Vec3(10, 10, 10);
    const mid = a.lerp(b, 0.5);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeCloseTo(5);
  });

  it("computes distance", () => {
    const a = new Vec3(0, 0, 0);
    const b = new Vec3(3, 4, 0);
    expect(a.distTo(b)).toBeCloseTo(5);
  });

  it("serializes to/from JSON", () => {
    const v = new Vec3(1.5, 2.5, 3.5);
    const json = v.toJSON();
    const v2 = Vec3.fromJSON(json);
    expect(v2.x).toBe(1.5);
    expect(v2.y).toBe(2.5);
    expect(v2.z).toBe(3.5);
  });

  it("is immutable — operations return new instances", () => {
    const a = new Vec3(1, 2, 3);
    const b = a.mul(2);
    expect(a.x).toBe(1); // a unchanged
    expect(b.x).toBe(2);
  });
});

describe("Vec2", () => {
  it("computes length", () => {
    const v = new Vec2(3, 4);
    expect(v.len()).toBeCloseTo(5);
  });

  it("rotates", () => {
    const v = new Vec2(1, 0);
    const r = v.rotate(Math.PI / 2);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
  });
});

describe("MathUtils", () => {
  it("clamps values", () => {
    expect(MathUtils.clamp(-1, 0, 10)).toBe(0);
    expect(MathUtils.clamp(5, 0, 10)).toBe(5);
    expect(MathUtils.clamp(15, 0, 10)).toBe(10);
  });

  it("lerps", () => {
    expect(MathUtils.lerp(0, 10, 0.5)).toBeCloseTo(5);
  });

  it("remaps", () => {
    expect(MathUtils.remap(5, 0, 10, 0, 100)).toBeCloseTo(50);
  });

  it("almostEqual", () => {
    expect(MathUtils.almostEqual(1.0000001, 1.0000002, 1e-6)).toBe(true);
    expect(MathUtils.almostEqual(1.0, 2.0)).toBe(false);
  });
});
