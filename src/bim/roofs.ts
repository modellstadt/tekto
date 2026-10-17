// ====================================================================
// BIM / Roofs — flat, shed, gable and hip roofs over a house (IfcRoof)
// ====================================================================
//
// A `Roof` is described by plain data — a footprint, a kind, a pitch, the
// eaves elevation, the overhangs and the build-up thickness — so a JSON
// record (a `Doc` record, a saved file) can describe one, and
// `JSON.stringify(roof)` gives that record back.
//
//   ✓ PLANES         — `planes()`: each roof plane's top surface as a 3D
//                      polygon, with its slab (the build-up) as a closed `Mesh`.
//   ✓ GABLES         — `gables(t)`: the wall infill above the end walls for a
//                      wall thickness `t`, since `Wall`s have a constant height.
//   ✓ DECOMPOSITION  — at export (`IfcWriter.addRoof(roof)`) the `IfcRoof`
//                      aggregates one `IfcSlab` .ROOF. per plane; the gables
//                      are `IfcWall`s of the same storey.
//   ✓ PROPERTY SETS  — open `properties` map → `Pset_RoofCommon`.
//
// Geometry, Z-up, metres. The footprint is the outside face of the walls; the
// underside of each roof plane rests on its top outer edge at the eaves
// elevation and rises at the pitch, the build-up sits on top. Slabs are cut
// plumb (vertically) at the eaves, the verges, the ridge and the hips, so
// neighbouring planes meet face to face.

import { Vec2, Vec3 } from "../core/math/vectors";
import { Polygon2D } from "../core/geometry/Polygon2D";
import { Segment } from "../core/geometry/Segment";
import { Mesh } from "../core/geometry/mesh/Mesh";
import { MeshFactory } from "../core/geometry/mesh/MeshFactory";
import type { PropertyMap } from "./walls/types";

/** The roof forms `Roof` builds: flat (any footprint), shed (mono-pitch), gable and hip (rectangular footprints). */
export type RoofKind = "flat" | "shed" | "gable" | "hip";

const KINDS: readonly RoofKind[] = ["flat", "shed", "gable", "hip"];
/** Above this the "roof" is a wall. */
const MAX_PITCH = 80;
/** Relative tolerance for a footprint corner to count as a right angle (|cos| of the corner). */
const RIGHT_ANGLE_TOL = 1e-6;

/**
 * Options for `new Roof(...)` — plain data, so a JSON record can describe a roof.
 *
 * The footprint is the outside face of the walls, at the eaves. For a shed, gable
 * or hip roof it is a rectangle of 4 corners (open or closed, either winding):
 *   • gable — the first edge (corner 0 → 1) is an eave: the ridge runs parallel
 *     to it over the middle of the span; edges 1 and 3 are the gables.
 *   • shed — the first edge is the low eave; the roof rises across to edge 2,
 *     the high side; edges 1 and 3 are the gables.
 *   • hip — all four edges are eaves; the ridge runs along the longer side
 *     (a square gives a pyramid).
 * A flat roof takes any simple polygon.
 */
export interface RoofOptions {
  kind: RoofKind;
  /** Outside face of the walls in the XY plane (metres): `Vec2`s or plain `{ x, y }`. */
  footprint: readonly { x: number; y: number }[];
  /** Roof pitch in degrees, above 0 and at most 80. Default 30; a flat roof ignores it (default 0). */
  pitch?: number;
  /** Eaves elevation in world Z: the top of the walls, where the underside of the roof meets their outside face. */
  eavesElevation: number;
  /** Horizontal overhang beyond the eaves (all round for flat and hip). Default 0.5 m. */
  overhang?: number;
  /** Horizontal overhang beyond the gables (shed, gable). Default: `overhang`. */
  gableOverhang?: number;
  /** Build-up thickness, measured square to the roof plane. Default 0.3 m. */
  thickness?: number;
  name?: string;
  /** Open Pset map → `Pset_RoofCommon` at IFC export. */
  properties?: PropertyMap;
}

/** One roof plane from `Roof.planes()`: its top surface as a 3D polygon and its build-up as a closed slab mesh. */
export interface RoofPlane {
  name: string;
  /** Top surface, counter-clockwise seen from above (world coordinates). */
  outline: Vec3[];
  /** Unit normal of the top surface, pointing up and out over its eave. */
  normal: Vec3;
  /** Area of the top surface, overhangs included (m²). */
  area: number;
  /** The footprint edge (index into `footprint`) the plane drains to; -1 for a flat roof. */
  edge: number;
  /** The plane's build-up as a closed solid: cut plumb at its eave, verges, ridge and hips. */
  mesh: Mesh;
}

/**
 * The wall infill a roof needs above an end wall, from `Roof.gables(thickness)`: a
 * triangle under a gable roof, a right triangle at the sides of a shed and a strip
 * over its high side. Its top follows the underside of the roof; its bottom is the
 * eaves elevation (the top of the walls).
 */
export interface RoofGable {
  name: string;
  /** The footprint edge (index into `footprint`) the infill stands on. */
  edge: number;
  /** Centreline in plan, half the thickness in from the footprint, in the edge's direction. */
  start: Vec2;
  end: Vec2;
  thickness: number;
  /** Highest point above the eaves elevation (m). */
  height: number;
  /** Area of its outside face (m²). */
  area: number;
  /** Closed solid, world coordinates. */
  mesh: Mesh;
}

/** A pitched roof's frame: corner `o`, `u` along the first (eave) edge for `length`, `v` across into the footprint for `span`. */
interface Frame {
  o: Vec2;
  u: Vec2;
  v: Vec2;
  length: number;
  span: number;
  /** The footprint index of the frame's corner 0 (a hip may start at corner 1, so its ridge runs along the longer side). */
  first: number;
}

/**
 * A roof over a house — the IFC `IfcRoof` analogue: flat, shed (mono-pitch), gable or
 * hip, from plain data (see `RoofOptions` for how the footprint orients it). Values
 * are checked on construction; an error names the input. Z-up, metres.
 *
 * @example
 *   const roof = new Roof({
 *     kind: "gable", pitch: 35, eavesElevation: 6, overhang: 0.6, gableOverhang: 0.3,
 *     footprint: [new Vec2(0, 0), new Vec2(10, 0), new Vec2(10, 8), new Vec2(0, 8)],
 *   });
 *   scene.addMesh(roof.toMesh());
 *   for (const g of roof.gables(0.3)) scene.addMesh(g.mesh);
 *   ifc.addRoof(roof, { storey: top, gableThickness: 0.3 });
 */
export class Roof {
  readonly kind: RoofKind;
  readonly footprint: Vec2[];
  readonly pitch: number;
  readonly eavesElevation: number;
  readonly overhang: number;
  readonly gableOverhang: number;
  readonly thickness: number;
  readonly name: string;
  readonly properties: PropertyMap;

  constructor(opts: RoofOptions) {
    this.name = opts.name ?? "Roof";
    const label = `Roof "${this.name}"`;
    if (!KINDS.includes(opts.kind)) {
      throw new Error(`${label}: kind must be "flat", "shed", "gable" or "hip", got ${JSON.stringify(opts.kind)}.`);
    }
    this.kind = opts.kind;
    this.footprint = (opts.footprint ?? []).map((p) => new Vec2(p.x, p.y));
    this.pitch = opts.pitch ?? (this.kind === "flat" ? 0 : 30);
    this.eavesElevation = opts.eavesElevation;
    this.overhang = opts.overhang ?? 0.5;
    this.gableOverhang = opts.gableOverhang ?? this.overhang;
    this.thickness = opts.thickness ?? 0.3;
    this.properties = opts.properties ?? {};

    if (!(this.pitch >= 0 && this.pitch <= MAX_PITCH)) {
      throw new Error(`${label}: pitch must be between 0° and ${MAX_PITCH}°, got ${this.pitch}.`);
    }
    if (this.kind !== "flat" && !(this.pitch > 0)) {
      throw new Error(`${label}: a ${this.kind} roof needs a pitch above 0° (a roof without one is kind "flat"), got ${this.pitch}.`);
    }
    if (!Number.isFinite(this.eavesElevation)) {
      throw new Error(`${label}: eavesElevation must be a finite number, got ${this.eavesElevation}.`);
    }
    if (!(this.overhang >= 0 && Number.isFinite(this.overhang))) {
      throw new Error(`${label}: overhang must be 0 or more, got ${this.overhang}.`);
    }
    if (!(this.gableOverhang >= 0 && Number.isFinite(this.gableOverhang))) {
      throw new Error(`${label}: gableOverhang must be 0 or more, got ${this.gableOverhang}.`);
    }
    if (!(this.thickness > 0 && Number.isFinite(this.thickness))) {
      throw new Error(`${label}: thickness must be above 0, got ${this.thickness}.`);
    }
    this.checkFootprint(label);
  }

  /** The build-up's vertical thickness: `thickness` square to a plane at the pitch. */
  private get rise(): number {
    return this.thickness / Math.cos(this.pitch * Math.PI / 180);
  }

  /** The roof planes, each with its top surface and its slab: one for flat and shed, two for gable, four for hip. */
  planes(): RoofPlane[] {
    if (this.kind === "flat") return [this.flatPlane()];
    const f = this.frame();
    const L = f.length, W = f.span, o = this.overhang, g = this.gableOverhang;
    // Each plane: the frame edge it drains to, and its outline in plan as (along, across).
    // A hip roof has eaves all round, so its overhang is `overhang` on every side.
    const specs: [number, [number, number][]][] =
      this.kind === "shed" ? [
        [0, [[-g, -o], [L + g, -o], [L + g, W + o], [-g, W + o]]],
      ] : this.kind === "gable" ? [
        [0, [[-g, -o], [L + g, -o], [L + g, W / 2], [-g, W / 2]]],
        [2, [[L + g, W / 2], [L + g, W + o], [-g, W + o], [-g, W / 2]]],
      ] : [
        [0, [[-o, -o], [L + o, -o], [L - W / 2, W / 2], [W / 2, W / 2]]],
        [1, [[L + o, -o], [L + o, W + o], [L - W / 2, W / 2]]],
        [2, [[L + o, W + o], [-o, W + o], [W / 2, W / 2], [L - W / 2, W / 2]]],
        [3, [[-o, W + o], [-o, -o], [W / 2, W / 2]]],
      ];
    const tan = Math.tan(this.pitch * Math.PI / 180);
    const sin = Math.sin(this.pitch * Math.PI / 180), cos = Math.cos(this.pitch * Math.PI / 180);
    const up = new Vec3(0, 0, this.rise);
    return specs.map(([edge, plan], i) => {
      // How far a plan point lies inside the plane's eave line: its underside rises that × tan.
      const inside = (s: number, t: number) => [t, L - s, W - t, s][edge];
      const inward = [f.v, f.u.neg(), f.v.neg(), f.u][edge];
      const pts = dedupe(plan).map(([s, t]) => {
        const p = f.o.add(f.u.mul(s)).add(f.v.mul(t));
        return new Vec3(p.x, p.y, this.eavesElevation + inside(s, t) * tan);
      });
      const ccw = Polygon2D.signedArea(pts.map((p) => new Vec2(p.x, p.y))) > 0;
      const underside = ccw ? pts : pts.slice().reverse();
      const outline = underside.map((p) => p.add(up));
      return {
        name: `${this.name} plane ${i + 1}`,
        outline,
        normal: new Vec3(-inward.x * sin, -inward.y * sin, cos),
        area: area3D(outline),
        edge: (edge + f.first) % 4,
        mesh: MeshFactory.extrude(underside, up),
      };
    });
  }

  /** The roof build-up as one mesh: every plane's slab (each a closed solid). */
  toMesh(): Mesh {
    return this.planes().map((p) => p.mesh).reduce((a, b) => a.merge(b));
  }

  /**
   * The ridge along the top of the build-up: over the middle of the span for a gable
   * (verge to verge), between the hips for a hip roof (a point for a pyramid), the top
   * edge of the high side for a shed. A flat roof has none: `null`.
   */
  ridge(): Segment | null {
    if (this.kind === "flat") return null;
    const f = this.frame();
    const L = f.length, W = f.span, o = this.overhang, g = this.gableOverhang;
    const tan = Math.tan(this.pitch * Math.PI / 180);
    const at = (s: number, t: number, z: number) => {
      const p = f.o.add(f.u.mul(s)).add(f.v.mul(t));
      return new Vec3(p.x, p.y, z);
    };
    if (this.kind === "shed") {
      const z = this.eavesElevation + (W + o) * tan + this.rise;
      return new Segment(at(-g, W + o, z), at(L + g, W + o, z));
    }
    const z = this.eavesElevation + (W / 2) * tan + this.rise;
    return this.kind === "gable"
      ? new Segment(at(-g, W / 2, z), at(L + g, W / 2, z))
      : new Segment(at(W / 2, W / 2, z), at(L - W / 2, W / 2, z));
  }

  /**
   * The highest point of the roof: the top of the build-up at the ridge (gable, hip),
   * along the high side's edge (shed), or the top of a flat roof. For a gable that is
   * `eavesElevation + span / 2 · tan(pitch) + thickness / cos(pitch)`.
   */
  ridgeHeight(): number {
    return this.ridge()?.a.z ?? this.eavesElevation + this.thickness;
  }

  /**
   * The wall infill above the end walls, for walls `wallThickness` thick standing inside the
   * footprint: under a gable roof a triangle on each gable (base: the span; height:
   * `span / 2 · tan(pitch)`); under a shed a right triangle on each side and a strip over the
   * high side, between them; none under a flat or hip roof. Each comes with its centreline
   * in plan, so an app can draw it and export it as a wall.
   */
  gables(wallThickness: number): RoofGable[] {
    if (this.kind === "flat" || this.kind === "hip") return [];
    const f = this.frame();
    const L = f.length, W = f.span, wt = wallThickness, e = this.eavesElevation;
    if (!(wt > 0 && wt <= L / 2 && (this.kind === "gable" || wt < W))) {
      throw new Error(`Roof "${this.name}": gables(wallThickness) needs a thickness above 0 and at most half the length (${L / 2} m)${this.kind === "shed" ? ` and below the span (${W} m)` : ""}, got ${wallThickness}.`);
    }
    const tan = Math.tan(this.pitch * Math.PI / 180);
    const at2 = (s: number, t: number) => f.o.add(f.u.mul(s)).add(f.v.mul(t));
    const at = (s: number, t: number, z: number) => { const p = at2(s, t); return new Vec3(p.x, p.y, z); };
    const along = (d: number) => new Vec3(f.u.x * d, f.u.y * d, 0);
    const out: RoofGable[] = [];
    const add = (edge: number, start: Vec2, end: Vec2, height: number, area: number, mesh: Mesh) => {
      out.push({ name: `${this.name} gable ${out.length + 1}`, edge: (edge + f.first) % 4, start, end, thickness: wt, height, area, mesh });
    };
    if (this.kind === "gable") {
      const h = (W / 2) * tan;
      add(1, at2(L - wt / 2, 0), at2(L - wt / 2, W), h, W * h / 2,
        MeshFactory.extrude([at(L, 0, e), at(L, W, e), at(L, W / 2, e + h)], along(-wt)));
      add(3, at2(wt / 2, W), at2(wt / 2, 0), h, W * h / 2,
        MeshFactory.extrude([at(0, W, e), at(0, 0, e), at(0, W / 2, e + h)], along(wt)));
      return out;
    }
    const h = W * tan;
    add(1, at2(L - wt / 2, 0), at2(L - wt / 2, W), h, W * h / 2,
      MeshFactory.extrude([at(L, 0, e), at(L, W, e), at(L, W, e + h)], along(-wt)));
    add(2, at2(L - wt, W - wt / 2), at2(wt, W - wt / 2), h, (L - 2 * wt) * h,
      MeshFactory.extrude([at(wt, W, e), at(wt, W, e + h), at(wt, W - wt, e + (W - wt) * tan), at(wt, W - wt, e)], along(L - 2 * wt)));
    add(3, at2(wt / 2, W), at2(wt / 2, 0), h, W * h / 2,
      MeshFactory.extrude([at(0, W, e), at(0, 0, e), at(0, W, e + h)], along(wt)));
    return out;
  }

  // ── Internals ──

  private checkFootprint(label: string): void {
    const ring = Polygon2D.openRing(this.footprint);
    if (ring.length < 3) throw new Error(`${label}: footprint needs at least 3 corners, got ${ring.length}.`);
    ring.forEach((p, i) => {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error(`${label}: footprint corner ${i} is not a finite point, got (${p.x}, ${p.y}).`);
      if (p.distTo(ring[(i + 1) % ring.length]) < 1e-9) throw new Error(`${label}: footprint edge ${i} has no length (corners ${i} and ${(i + 1) % ring.length} coincide).`);
    });
    if (!(Polygon2D.area(ring) > 1e-9)) throw new Error(`${label}: footprint encloses no area.`);
    if (this.kind === "flat") return;
    if (ring.length !== 4) {
      throw new Error(`${label}: a ${this.kind} roof needs a rectangular footprint of 4 corners, got ${ring.length} corners (any polygon takes kind "flat").`);
    }
    for (let i = 0; i < 4; i++) {
      const a = ring[i].sub(ring[(i + 3) % 4]).normalize(), b = ring[(i + 1) % 4].sub(ring[i]).normalize();
      const cos = a.dot(b);
      if (Math.abs(cos) > RIGHT_ANGLE_TOL) {
        const deg = 180 - Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
        throw new Error(`${label}: a ${this.kind} roof needs a rectangular footprint, but corner ${i} is ${deg.toFixed(2)}°, not 90°.`);
      }
    }
  }

  private frame(): Frame {
    const ring = Polygon2D.openRing(this.footprint);
    const first = this.kind === "hip" && ring[0].distTo(ring[1]) < ring[1].distTo(ring[2]) ? 1 : 0;
    const q = [0, 1, 2, 3].map((i) => ring[(i + first) % 4]);
    const length = q[0].distTo(q[1]), span = q[0].distTo(q[3]);
    return { o: q[0], u: q[1].sub(q[0]).div(length), v: q[3].sub(q[0]).div(span), length, span, first };
  }

  private flatPlane(): RoofPlane {
    const ring = Polygon2D.openRing(this.footprint);
    const grown = this.overhang > 0 ? Polygon2D.offset(ring, this.overhang) : ring;
    const outer = Polygon2D.signedArea(grown) > 0 ? grown : grown.slice().reverse();
    const z0 = this.eavesElevation, z1 = z0 + this.thickness, n = outer.length;
    const positions = [...outer.map((p) => new Vec3(p.x, p.y, z0)), ...outer.map((p) => new Vec3(p.x, p.y, z1))];
    const faces: number[][] = [];
    for (const [a, b, c] of Polygon2D.triangulateWithHoles(outer)) faces.push([n + a, n + b, n + c], [c, b, a]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faces.push([i, j, n + j, n + i]);
    }
    const outline = positions.slice(n);
    return {
      name: `${this.name} plane 1`,
      outline,
      normal: new Vec3(0, 0, 1),
      area: Polygon2D.area(outer),
      edge: -1,
      mesh: Mesh.fromFaces(positions, faces),
    };
  }
}

/** Drop consecutive repeats (a hip roof's ridge shrinks to a point over a square). */
function dedupe(pts: [number, number][]): [number, number][] {
  return pts.filter(([s, t], i) => {
    const [s1, t1] = pts[(i + 1) % pts.length];
    return Math.hypot(s - s1, t - t1) > 1e-9;
  });
}

/** Area of a planar 3D polygon (Newell). */
function area3D(pts: Vec3[]): number {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    x += (a.y - b.y) * (a.z + b.z);
    y += (a.z - b.z) * (a.x + b.x);
    z += (a.x - b.x) * (a.y + b.y);
  }
  return Math.hypot(x, y, z) / 2;
}
