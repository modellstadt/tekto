// ====================================================================
// Sun position — date + latitude/longitude → sky direction
// ====================================================================
//
// Lightweight Michalsky-style solar position algorithm (1988). Accurate
// to ~0.01° between 1950 and 2050 — plenty for architecture / shadow
// studies, daylight analysis, BIM sun studies. No external dependencies.
//
// Coordinate convention:
//   Returns the unit direction vector in a **Z-up** frame with
//   +X = east, +Y = north, +Z = sky. That's the natural geographic
//   frame and matches Tekto's Z-up demos directly. For a Y-up scene,
//   re-map (e_x, n_y, u_z) → (e_x, u_z, −n_y) on the consumer side.

import { Vec3 } from "../math/vectors";

export interface SunPositionInput {
  /**
   * UTC date+time. The algorithm internally converts to Julian Date in
   * UT, so make sure the `Date` carries UTC fields (a `new Date()` is
   * fine — `getUTC*()` methods are used).
   */
  date: Date;
  /** Latitude in degrees, north positive. e.g. Zurich = +47.37. */
  latitude: number;
  /** Longitude in degrees, east positive. e.g. Zurich = +8.55. */
  longitude: number;
}

export interface SunPositionResult {
  /** Solar altitude above horizon (radians). Negative ⇒ below horizon (night). */
  altitude: number;
  /**
   * Solar azimuth from north, clockwise (radians).
   * 0 = N, π/2 = E, π = S, 3π/2 = W.
   */
  azimuth: number;
  /**
   * Unit vector pointing FROM the origin TO the sun, in Z-up scene
   * coordinates (+X = east, +Y = north, +Z = up). When daytime, this
   * is the direction a directional light "comes from" — set the light
   * position to `direction × distance` and aim it at the origin.
   */
  direction: Vec3;
  /** Convenience: `altitude > 0`. */
  isDaytime: boolean;
}

export const SunPosition = {
  /**
   * Compute the sun's position in the sky for a given UTC instant and
   * geographic coordinates.
   *
   * @example
   *   // Solar noon, summer solstice, Zurich:
   *   const sun = SunPosition.compute({
   *     date:      new Date(Date.UTC(2025, 5, 21, 11, 30)),
   *     latitude:  47.37,
   *     longitude: 8.55,
   *   });
   *   // sun.altitude ≈ 1.10 rad (≈ 63°), sun.azimuth ≈ π (south).
   *   threeLight.position.copy(sun.direction).multiplyScalar(50);
   */
  compute(opts: SunPositionInput): SunPositionResult {
    const { date, latitude, longitude } = opts;

    // ── 1. Days since J2000.0 (= 2000-01-01 12:00 UT, JD 2451545) ──
    const year   = date.getUTCFullYear();
    const month  = date.getUTCMonth() + 1;
    const day    = date.getUTCDate();
    const hour   = date.getUTCHours()
                 + date.getUTCMinutes() / 60
                 + date.getUTCSeconds() / 3600;
    const jd0 = julianDay(year, month, day);
    const t   = jd0 + hour / 24 - 2451545.0;

    // ── 2. Mean longitude + mean anomaly (degrees) ──
    const meanLon  = mod360(280.460 + 0.9856474 * t);
    const meanAnom = mod360(357.528 + 0.9856003 * t);
    const mA = rad(meanAnom);

    // ── 3. Ecliptic longitude (equation of center applied) ──
    const eclLon = mod360(
      meanLon
      + 1.915 * Math.sin(mA)
      + 0.020 * Math.sin(2 * mA),
    );
    const eL = rad(eclLon);

    // ── 4. Obliquity of the ecliptic ──
    const obliq = rad(23.439 - 0.0000004 * t);

    // ── 5. Right ascension + declination ──
    let ra = Math.atan2(Math.cos(obliq) * Math.sin(eL), Math.cos(eL));
    if (ra < 0) ra += 2 * Math.PI;
    const decl = Math.asin(Math.sin(obliq) * Math.sin(eL));

    // ── 6. Greenwich + Local Mean Sidereal Time ──
    let gmst = (6.697375 + 0.0657098242 * t + hour) % 24;
    if (gmst < 0) gmst += 24;
    let lmst = (gmst + longitude / 15) % 24;
    if (lmst < 0) lmst += 24;

    // ── 7. Hour angle ──
    let ha = rad(lmst * 15) - ra;
    if (ha >  Math.PI) ha -= 2 * Math.PI;
    if (ha < -Math.PI) ha += 2 * Math.PI;

    // ── 8. Altitude + azimuth ──
    const lat    = rad(latitude);
    const sinAlt = Math.sin(decl) * Math.sin(lat)
                 + Math.cos(decl) * Math.cos(lat) * Math.cos(ha);
    const altitude = Math.asin(clamp(sinAlt, -1, 1));
    const cosAlt   = Math.cos(altitude);

    // Azimuth measured FROM NORTH, CLOCKWISE (geographic convention).
    //   sin(Az)·cos(α) = −cos(δ)·sin(H)
    //   cos(Az)·cos(α) =  sin(δ)·cos(φ) − cos(δ)·cos(H)·sin(φ)
    let azimuth = 0;
    if (cosAlt > 1e-9) {
      const sinAz = -Math.cos(decl) * Math.sin(ha);
      const cosAz = Math.sin(decl) * Math.cos(lat)
                  - Math.cos(decl) * Math.cos(ha) * Math.sin(lat);
      azimuth = Math.atan2(sinAz, cosAz);
      if (azimuth < 0) azimuth += 2 * Math.PI;
      if (azimuth >= 2 * Math.PI) azimuth -= 2 * Math.PI;
    }

    // ── 9. Unit direction (Z-up scene coords) ──
    // +X = east, +Y = north, +Z = up.
    const direction = new Vec3(
      Math.sin(azimuth) * cosAlt,
      Math.cos(azimuth) * cosAlt,
      Math.sin(altitude),
    );

    return { altitude, azimuth, direction, isDaytime: altitude > 0 };
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────

function rad(deg: number): number { return deg * Math.PI / 180; }
function clamp(v: number, lo: number, hi: number): number { return v < lo ? lo : v > hi ? hi : v; }
function mod360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Julian Day at 0h UT (Gregorian). Standard astronomical formula. */
function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716))
       + Math.floor(30.6001 * (m + 1))
       + day + b - 1524.5;
}
