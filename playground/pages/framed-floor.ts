/**
 * Framed Floor — a timber-joist floor over a stair: the stair's `slabOpening` is the well, and
 * `JoistedSlab` frames it with a trimmer along each side and a header across each end, the joists
 * between stop at the headers, and the sheathing and ceiling leave the well open. Export IFC
 * writes the slab voided by the well, its members gathered under it, and the stair: its flights
 * and landing gathered under an IfcStair.
 *
 *   sliders   the stair's shape, turn and landing, the joist spacing, the joist direction
 *   callouts  one per kind of member
 */
import {
  appShell, download, IfcWriter, JoistedSlab, Mesh, realizeSlab, Slab, SlabType, Stair, Vec2, Vec3,
  type CalloutItem, type SlabPart, type StairShape,
} from "../../src";

/** Colour by framing role, the way a cut list groups them. */
const ROLE_COLOUR: Record<string, string> = {
  joist: "#d2a86a", trimmer: "#b98442", header: "#a8702f", beam: "#c79355",
  sheathing: "#e8dcc4", ceiling: "#eef0f2",
};
const ROLE_LABEL: Record<string, string> = { joist: "Joist", trimmer: "Trimmer", header: "Header", beam: "Rim joist" };
const STAIR_COLOUR = "#c9c6c0";
const LENGTH = 6, WIDTH = 4.5, LEVEL = 3;

/** The stair from the ground to the floor, its footprint centred on the floor. */
function buildStair(shape: StairShape, turn: "left" | "right", landingDepth: number, gap: number): Stair {
  const opts = { name: "Stair", start: new Vec3(0, 0, 0), totalRise: LEVEL, width: 1, shape, turn, landingDepth, gap };
  const ring = new Stair(opts).footprint();
  const xs = ring.map(p => p.x), ys = ring.map(p => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return new Stair({ ...opts, start: new Vec3(LENGTH / 2 - cx, WIDTH / 2 - cy, 0) });
}

function buildFloor(spacing: number, northSouth: boolean, stair: Stair): Slab {
  const type = new SlabType({
    name: "Holzbalkendecke",
    construction: JoistedSlab({ spacing, profile: { w: 0.06, h: 0.22, name: "KVH 60×220" } }),
  });
  const slab = new Slab({
    boundary: [new Vec2(0, 0), new Vec2(LENGTH, 0), new Vec2(LENGTH, WIDTH), new Vec2(0, WIDTH)],
    thickness: 0.2545, elevation: LEVEL, name: "First floor", type,
    joistDirection: northSouth ? new Vec2(0, 1) : new Vec2(1, 0),
  });
  // The well: wherever a tread has less than 2 m of headroom under the slab.
  const well = stair.slabOpening(slab);
  if (well) slab.openings.push(well);
  return slab;
}

export default function (container: HTMLElement) {
  let slab: Slab | null = null;
  let stair: Stair | null = null;
  let parts: SlabPart[] = [];

  const app = appShell({
    title: "Framed Floor",
    container,
    topBar: true,
    navGizmo: true,
    shadingBar: true,
    units: "m",
    camera: [8, -5.5, 7],
    target: [3, 2.25, 1.8],
    params: {
      spacing: { type: "float", min: 0.4, max: 0.9, default: 0.625, step: 0.025, label: "Joist spacing" },
      northSouth: { type: "bool", default: false, label: "Joists N–S" },
      shape: { type: "select", options: ["straight_run", "two_straight_run", "quarter_turn", "half_turn"], default: "half_turn", label: "Shape" },
      turn: { type: "select", options: ["left", "right"], default: "left", label: "Turn" },
      landingDepth: { type: "float", min: 1, max: 1.8, default: 1, step: 0.05, label: "Landing depth" },
      gap: { type: "float", min: 0, max: 0.4, default: 0.1, step: 0.02, label: "Gap (U)" },
      plates: { type: "bool", default: false, label: "Sheathing + ceiling" },
      callouts: { type: "bool", default: true, label: "Callouts", display: true },
      ifc: { type: "button", label: "Export IFC", action: () => exportIfc() },
    },
    groups: {
      Floor: ["spacing", "northSouth"],
      Stair: ["shape", "turn", "landingDepth", "gap"],
      Show: ["plates", "callouts"],
      File: ["ifc"],
    },
  });

  app.onBuild(() => {
    app.scene.clear();
    const p = app.params;
    stair = buildStair(p.get("shape") as StairShape, p.get("turn") as "left" | "right", p.get("landingDepth"), p.get("gap"));
    slab = buildFloor(p.get("spacing"), p.get("northSouth"), stair);
    parts = realizeSlab(slab).parts;
    const plates = p.get("plates");
    parts.forEach((part, i) => {
      const role = String(part.role);
      if (!plates && (role === "sheathing" || role === "ceiling")) return;
      app.scene.withKey(`members/${i}`, () => {
        app.scene.addMesh(part.mesh, { color: ROLE_COLOUR[role] ?? "#d9dde3", label: part.name, layer: role });
      });
    });
    app.scene.withKey("stair", () => {
      for (const f of stair!.flights()) {
        app.scene.addMesh(new Mesh(f.positions, f.indices), { color: STAIR_COLOUR, flatShading: true, label: f.name, layer: "stair" });
      }
      const landing = stair!.landing();
      if (landing) app.scene.addMesh(landing.toMesh(), { color: STAIR_COLOUR, label: landing.name, layer: "stair" });
    });
  });

  app.onDisplay(() => {
    app.renderer.setCallouts(app.params.get("callouts") ? callouts() : []);
    const count = (role: string) => parts.filter(p => p.role === role).length;
    const riser = stair ? ` · ${stair.risers} risers of ${(stair.actualRiser * 1000).toFixed(0)} mm` : "";
    app.status(`${count("joist")} joists · ${count("trimmer")} trimmers · ${count("header")} headers${riser}`);
  });

  /** One callout per kind of member, pointing at the middle one of its kind. */
  function callouts(): CalloutItem[] {
    const byRole = new Map<string, number[]>();
    parts.forEach((p, i) => byRole.set(String(p.role), [...(byRole.get(String(p.role)) ?? []), i]));
    return [...byRole].filter(([role]) => ROLE_LABEL[role]).map(([role, ids]) => ({
      id: role,
      text: ROLE_LABEL[role],
      detail: `${ids.length} ×${parts[ids[0]].profile?.name ? ` ${parts[ids[0]].profile!.name}` : ""}`,
      colour: ROLE_COLOUR[role],
      objects: [`members/${ids[Math.floor(ids.length / 2)]}`],
    }));
  }

  function exportIfc() {
    if (!slab || !stair) return;
    const ifc = new IfcWriter({ projectName: "Framed floor" });
    ifc.addStair(stair);                                    // on the ground floor
    const first = ifc.addStorey({ name: "First floor", elevation: LEVEL });
    ifc.addSlab(slab, { storey: first, parts });
    download(ifc.save(), "framed-floor.ifc", { stamp: true });
  }

  app.rebuild();

  // For agents and tests: the slab, its parts and the stair under it.
  (window as unknown as { framedFloor: unknown }).framedFloor = {
    get slab() { return slab; }, get parts() { return parts; }, get stair() { return stair; },
  };

  return { dispose() { app.dispose(); } };
}
