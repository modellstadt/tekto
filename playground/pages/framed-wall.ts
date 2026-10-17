/**
 * Framed Wall — the one renderer looking at a building: render modes, a section, named
 * views, the axis widget, callouts, outlined selection, hover and framing a part.
 *
 * The subject is a framed wall from `WallSystem`, so the modes have something with depth:
 * Solid reads the framing against the boards, Ghost shows the studs through the sheathing,
 * Hidden with Ortho and the axis widget's front view is an elevation drawing, and Cut ▾ →
 * Plan is the wall in plan.
 *
 *   top bar      Light · Mode · Cam (Persp | Ortho, Iso) · Cut ▾ · Sun ▾
 *   axis widget  click an axis for a plan or an elevation, toggle persp/ortho under it
 *   click        selects a member (outlined, its colour kept); Frame selection zooms to it
 *   callouts     one per kind of member, in the margins, hidden ones left out
 *   window       its frame and glass from `openingFill`, as the IFC export writes them
 */
import {
  appShell, Selection, selectOnClick, Vec2, Wall, WallOpening, WallType, HolzrahmenBau,
  holzrahmenbauLayers, realize, openingFill, type CalloutItem, type WallPart, type OpeningFillPart,
} from "../../src";

/** Colour by framing role, the way a cut list groups them. */
const ROLE_COLOUR: Record<string, string> = {
  stud: "#d2a86a", king: "#c79355", jack: "#c79355", cripple: "#dcbc8b",
  topPlate: "#b98442", bottomPlate: "#b98442", sillPlate: "#b98442",
  header: "#a8702f", sill: "#a8702f", blocking: "#dcbc8b", noggin: "#dcbc8b",
};
const HEIGHT = 2.7, LENGTH = 5;

function buildWall(spacing: number, depth: number, windowWidth: number): { parts: WallPart[]; fill: OpeningFillPart[] } {
  const layers = holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: depth } });
  const type = new WallType({
    name: `Holzrahmenbau ${Math.round(depth * 1000)} mm`,
    construction: HolzrahmenBau({
      studProfile: { w: 0.06, h: depth, name: `KVH 60×${Math.round(depth * 1000)}` },
      studSpacing: spacing,
    }),
    layers,
    properties: { loadBearing: true, isExternal: true },
  });
  const wall = new Wall({
    centerline: [new Vec2(0, 0), new Vec2(LENGTH, 0)],
    thickness: layers.reduce((t, l) => t + l.thickness, 0),
    height: HEIGHT, name: "Wall", type,
  });
  wall.openings.push(WallOpening.window(LENGTH / 2, windowWidth, 0.9, 2.2));
  wall.syncOpeningsToRibbon();
  return { parts: realize(wall).parts.filter(p => p.mesh.positions.length), fill: openingFill(wall, wall.openings[0]) };
}

export default function (container: HTMLElement) {
  const selection = new Selection();
  let parts: WallPart[] = [];

  const app = appShell({
    title: "Framed Wall",
    container,
    topBar: true,
    navGizmo: true,
    camera: [6.5, -7, 3.8],
    target: [2.5, 0, 1.35],
    params: {
      spacing: { type: "float", min: 0.4, max: 0.9, default: 0.625, step: 0.025, label: "Stud spacing" },
      depth: { type: "float", min: 0.1, max: 0.24, default: 0.16, step: 0.02, label: "Stud depth" },
      window: { type: "float", min: 0.6, max: 2.4, default: 1.4, step: 0.1, label: "Window width" },
      callouts: { type: "bool", default: true, label: "Callouts", display: true },
      outline: { type: "bool", default: true, label: "Outline selection", display: true },
      frame: { type: "button", label: "Frame selection", action: () => frameSelection() },
      all: { type: "button", label: "Frame all", action: () => app.renderer.fitTo(app.scene.all().map(o => o.id), { margin: 1.25 }) },
    },
    groups: {
      Wall: ["spacing", "depth", "window"],
      Show: ["callouts", "outline"],
      View: ["frame", "all"],
    },
  });

  // Each member is a record: `members/<i>`. The selection, callouts and Frame name it.
  app.onBuild(() => {
    app.scene.clear();
    const built = buildWall(app.params.get("spacing"), app.params.get("depth"), app.params.get("window"));
    parts = built.parts;
    parts.forEach((part, i) => app.scene.withKey(`members/${i}`, () => {
      const role = String(part.role);
      app.scene.addMesh(part.mesh, { color: ROLE_COLOUR[role] ?? "#d9dde3", label: part.name, layer: role });
    }));
    // The window: its frame and glass, as the IFC export writes them.
    built.fill.forEach((part) => app.scene.withKey("window", () => app.scene.addMesh(part.mesh, part.role === "glazing"
      ? { color: "#9cc8e8", opacity: 0.4, label: part.name, layer: "window" }
      : { color: "#7d5f45", label: part.name, layer: "window" })));
  });

  app.onDisplay(() => {
    app.renderer.setSelectionStyle(app.params.get("outline") ? "outline" : "tint");
    app.renderer.setCallouts(app.params.get("callouts") ? callouts() : [], {
      onPick: (role) => selection.select(parts.flatMap((p, i) => (String(p.role) === role ? [`members/${i}`] : []))),
    });
    status();
  });

  /** One callout per kind of member, pointing at the middle one of its kind. */
  function callouts(): CalloutItem[] {
    const byRole = new Map<string, number[]>();
    parts.forEach((p, i) => byRole.set(String(p.role), [...(byRole.get(String(p.role)) ?? []), i]));
    return [...byRole].map(([role, ids]) => {
      const profile = parts[ids[0]].profile?.name;
      return {
        id: role,
        text: parts[ids[0]].name.replace(/\s*\d+$/, ""),
        detail: `${ids.length} ×${profile ? ` ${profile}` : ""}`,
        colour: ROLE_COLOUR[role],
        objects: [`members/${ids[Math.floor(ids.length / 2)]}`],
      };
    });
  }

  function frameSelection() {
    const keys = selection.keys();
    app.renderer.fitTo(keys.length ? keys : app.scene.all().map(o => o.id));
  }

  // ── Selection and hover ──
  const stopSelecting = selectOnClick(app.renderer, app.scene, selection);
  let hovered: string | null = null;
  const stopHover = app.renderer.onHover((id) => { hovered = id ? app.scene.get(id)?.style.label ?? null : null; status(); });
  selection.onChange(status);

  function status() {
    const sel = selection.ids("members").map(i => parts[Number(i)]).filter(Boolean);
    const one = sel.length === 1 ? sel[0] : null;
    const what = one
      ? `${one.name}${one.profile ? ` · ${one.profile.name}` : ""}${one.length ? ` · ${one.length.toFixed(3)} m` : ""}`
      : sel.length ? `${sel.length} members` : "click a member";
    app.status(`${parts.length} members · ${what}${hovered ? `  ·  over: ${hovered}` : ""}`);
  }

  app.rebuild();

  // For agents and tests: the selection, and the members behind it.
  (window as unknown as { framedWall: unknown }).framedWall = { selection, get parts() { return parts; } };

  return {
    dispose() {
      stopHover();
      stopSelecting();
      app.dispose();
    },
  };
}
