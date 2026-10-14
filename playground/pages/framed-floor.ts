/**
 * Framed Floor — a timber-joist floor with a stair well: `JoistedSlab` frames the opening
 * with a trimmer along each side and a header across each end, the joists between stop at
 * the headers, and the sheathing and ceiling leave the well open. Export IFC writes the slab
 * voided by the well, its members gathered under it.
 *
 *   sliders   the well's size and position, the joist spacing, the joist direction
 *   callouts  one per kind of member
 */
import {
  appShell, download, IfcWriter, JoistedSlab, realizeSlab, Slab, SlabOpening, SlabType, Vec2,
  type CalloutItem, type SlabPart,
} from "../../src";

/** Colour by framing role, the way a cut list groups them. */
const ROLE_COLOUR: Record<string, string> = {
  joist: "#d2a86a", trimmer: "#b98442", header: "#a8702f", beam: "#c79355",
  sheathing: "#e8dcc4", ceiling: "#eef0f2",
};
const ROLE_LABEL: Record<string, string> = { joist: "Joist", trimmer: "Trimmer", header: "Header", beam: "Rim joist" };
const LENGTH = 6, WIDTH = 4.5, LEVEL = 3;

function buildFloor(spacing: number, wellWidth: number, wellDepth: number, wellX: number, wellY: number, northSouth: boolean): Slab {
  const type = new SlabType({
    name: "Holzbalkendecke",
    construction: JoistedSlab({ spacing, profile: { w: 0.06, h: 0.22, name: "KVH 60×220" } }),
  });
  return new Slab({
    boundary: [new Vec2(0, 0), new Vec2(LENGTH, 0), new Vec2(LENGTH, WIDTH), new Vec2(0, WIDTH)],
    thickness: 0.2545, elevation: LEVEL, name: "First floor", type,
    joistDirection: northSouth ? new Vec2(0, 1) : new Vec2(1, 0),
    openings: [new SlabOpening(wellX, wellY, wellWidth, wellDepth, "Stair well")],
  });
}

export default function (container: HTMLElement) {
  let slab: Slab | null = null;
  let parts: SlabPart[] = [];

  const app = appShell({
    title: "Framed Floor",
    container,
    topBar: true,
    navGizmo: true,
    shadingBar: true,
    units: "m",
    camera: [7.5, -5, 7.5],
    target: [3, 2.25, 2.8],
    params: {
      spacing: { type: "float", min: 0.4, max: 0.9, default: 0.625, step: 0.025, label: "Joist spacing" },
      northSouth: { type: "bool", default: false, label: "Joists N–S" },
      wellWidth: { type: "float", min: 0.6, max: 3, default: 2.6, step: 0.05, label: "Well along joists" },
      wellDepth: { type: "float", min: 0.6, max: 2, default: 1.1, step: 0.05, label: "Well across" },
      wellX: { type: "float", min: 1, max: 5, default: 3.6, step: 0.05, label: "Well x" },
      wellY: { type: "float", min: 1, max: 3.5, default: 2.9, step: 0.05, label: "Well y" },
      plates: { type: "bool", default: false, label: "Sheathing + ceiling" },
      callouts: { type: "bool", default: true, label: "Callouts", display: true },
      ifc: { type: "button", label: "Export IFC", action: () => exportIfc() },
    },
    groups: {
      Floor: ["spacing", "northSouth"],
      "Stair well": ["wellWidth", "wellDepth", "wellX", "wellY"],
      Show: ["plates", "callouts"],
      File: ["ifc"],
    },
  });

  app.onBuild(() => {
    app.scene.clear();
    const p = app.params;
    slab = buildFloor(p.get("spacing"), p.get("wellWidth"), p.get("wellDepth"), p.get("wellX"), p.get("wellY"), p.get("northSouth"));
    parts = realizeSlab(slab).parts;
    const plates = p.get("plates");
    parts.forEach((part, i) => {
      const role = String(part.role);
      if (!plates && (role === "sheathing" || role === "ceiling")) return;
      app.scene.withKey(`members/${i}`, () => {
        app.scene.addMesh(part.mesh, { color: ROLE_COLOUR[role] ?? "#d9dde3", label: part.name, layer: role });
      });
    });
  });

  app.onDisplay(() => {
    app.renderer.setCallouts(app.params.get("callouts") ? callouts() : []);
    const count = (role: string) => parts.filter(p => p.role === role).length;
    app.status(`${count("joist")} joists · ${count("trimmer")} trimmers · ${count("header")} headers`);
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
    if (!slab) return;
    const ifc = new IfcWriter({ projectName: "Framed floor" });
    const first = ifc.addStorey({ name: "First floor", elevation: LEVEL });
    ifc.addSlab(slab, { storey: first, parts });
    download(ifc.save(), "framed-floor.ifc", { stamp: true });
  }

  app.rebuild();

  // For agents and tests: the slab and its parts.
  (window as unknown as { framedFloor: unknown }).framedFloor = { get slab() { return slab; }, get parts() { return parts; } };

  return { dispose() { app.dispose(); } };
}
