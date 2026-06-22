import { describe, it, expect } from "vitest";
import { SunPosition } from "../src/core/solar/SunPosition";

const DEG = (r: number) => r * 180 / Math.PI;

/**
 * Reference cases. Tolerances are deliberately generous (±2°) — the
 * algorithm is good to ~0.01° but we'd rather catch sign / convention
 * flips than nail every minute. NOAA solar calculator was used to
 * generate the expected altitude/azimuth.
 */
describe("SunPosition", () => {
  it("Zurich, summer solstice, solar noon → sun ~south, high", () => {
    // 2025-06-21 13:30 CEST = 11:30 UTC
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 5, 21, 11, 30)),
      latitude:  47.37,
      longitude:  8.55,
    });
    expect(DEG(sun.altitude)).toBeGreaterThan(60);
    expect(DEG(sun.altitude)).toBeLessThan(70);
    // Almost due south (180°), within a couple of degrees.
    expect(DEG(sun.azimuth)).toBeGreaterThan(175);
    expect(DEG(sun.azimuth)).toBeLessThan(185);
    expect(sun.isDaytime).toBe(true);
    // +Y axis is north; with sun in the south, direction.y < 0.
    expect(sun.direction.y).toBeLessThan(0);
    expect(sun.direction.z).toBeGreaterThan(0.85); // high → mostly up
  });

  it("Zurich, winter solstice, solar noon → sun ~south, low", () => {
    // 2025-12-21 12:30 CET = 11:30 UTC (CET, not CEST in winter)
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 11, 21, 11, 30)),
      latitude:  47.37,
      longitude:  8.55,
    });
    // 90 − 47.37 − 23.4 ≈ 19° expected altitude
    expect(DEG(sun.altitude)).toBeGreaterThan(15);
    expect(DEG(sun.altitude)).toBeLessThan(23);
    expect(DEG(sun.azimuth)).toBeGreaterThan(175);
    expect(DEG(sun.azimuth)).toBeLessThan(185);
  });

  it("Sydney (southern hemisphere), summer solstice → sun ~north", () => {
    // 2025-12-21 12:30 AEDT = 01:30 UTC. Summer in southern hemisphere.
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 11, 21, 1, 30)),
      latitude:  -33.87,
      longitude: 151.21,
    });
    expect(DEG(sun.altitude)).toBeGreaterThan(65);
    // Sun on the NORTH side now (azimuth near 0/360). Sun is only ~10°
    // from zenith here so the azimuth is genuinely sensitive — relax
    // to ±35° from due north (still clearly "north" — south would be ~180°).
    const az = DEG(sun.azimuth);
    const azFromNorth = Math.min(az, 360 - az);
    expect(azFromNorth).toBeLessThan(35);
    expect(sun.direction.y).toBeGreaterThan(0); // toward +Y (north)
  });

  it("equator, spring equinox, local noon → sun overhead", () => {
    // 2025-03-20 12:00 UTC at lon 0, lat 0. Sun should be ~at zenith.
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 2, 20, 12, 0)),
      latitude:   0,
      longitude:  0,
    });
    expect(DEG(sun.altitude)).toBeGreaterThan(85); // within a few ° of zenith
  });

  it("Reykjavik, winter solstice, midnight → below horizon", () => {
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 11, 21, 0, 0)),
      latitude:  64.13,
      longitude:-21.95,
    });
    expect(sun.isDaytime).toBe(false);
    expect(sun.altitude).toBeLessThan(0);
  });

  it("Anchorage, summer solstice, local midnight → sun still up (or just below)", () => {
    // 2025-06-21 midnight AKDT = 08:00 UTC. Near-arctic midnight sun
    // territory; at 61.2°N the sun is close to the horizon at midnight
    // on the solstice.
    const sun = SunPosition.compute({
      date:      new Date(Date.UTC(2025, 5, 21, 8, 0)),
      latitude:  61.22,
      longitude:-149.90,
    });
    expect(Math.abs(DEG(sun.altitude))).toBeLessThan(10);
  });

  it("direction vector is unit length", () => {
    const sun = SunPosition.compute({
      date: new Date(Date.UTC(2025, 5, 21, 11, 30)),
      latitude: 47.37, longitude: 8.55,
    });
    const len = Math.hypot(sun.direction.x, sun.direction.y, sun.direction.z);
    expect(len).toBeGreaterThan(0.999);
    expect(len).toBeLessThan(1.001);
  });

  it("direction matches (azimuth, altitude) spherical convention", () => {
    const sun = SunPosition.compute({
      date: new Date(Date.UTC(2025, 5, 21, 11, 30)),
      latitude: 47.37, longitude: 8.55,
    });
    // x = sin(az) · cos(alt); y = cos(az) · cos(alt); z = sin(alt)
    const cosAlt = Math.cos(sun.altitude);
    expect(sun.direction.x).toBeCloseTo(Math.sin(sun.azimuth) * cosAlt, 6);
    expect(sun.direction.y).toBeCloseTo(Math.cos(sun.azimuth) * cosAlt, 6);
    expect(sun.direction.z).toBeCloseTo(Math.sin(sun.altitude), 6);
  });
});
