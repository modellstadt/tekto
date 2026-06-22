/**
 * Walls — Balloon-frame ↔ Holzrahmenbau with first-class joints.
 *
 * The room is modelled as **4 separate walls** (south, east, north, west)
 * meeting at L-junctions. Plus one interior partition that T-junctions
 * into the east wall.
 *
 * `WallType.junctionStyle` controls how the joints behave:
 *   - Holzrahmenbau → "butt"      (one wall through, others butt; prefab panel convention)
 *   - BalloonFrame  → "mitered"   (classic site-built NA framing convention)
 *
 * Drag the teal corners to reshape; the red / blue spheres place the door
 * and window anywhere along the room perimeter (they snap to the closest
 * wall); the orange sphere is the partition's free endpoint.
 */
import { sketch, SketchInstance, Vec2, Polygon2D } from "../../../src";
import {
  Wall, WallOpening, WallSystem,
  WallType, BalloonFrame, HolzrahmenBau, holzrahmenbauLayers,
  buildCutList,
  IfcWriter,
  Slab, SlabType, JoistedSlab, chooseJoistDirection,
} from "../../../src";
import type { WallConstruction } from "../../../src";
import {
  colorForRole, colorForSlabRole,
  pointAtArcLength, placeOpeningOnPerimeter,
  syncInfoPanel, makeNumberRow, makeSelectRow,
} from "./helpers";

// Currently picked wall name (from envelope pick). Cleared when user
// picks a handle or background.
let pickedWallName: string | null = null;
// Currently picked slab name ("floor" / "ceiling"). Same priority as wall.
let pickedSlabName: string | null = null;
// Per-slab parameter overrides — let each slab carry its own thickness /
// joist spacing / joist depth / orientation method, independent of the
// shared sidebar defaults.
interface SlabOverride {
  thickness?: number;
  joistSpacing?: number;
  joistDepth?: number;
  edgeOffset?: number;
  bearingGap?: number;
  orientationMethod?: string;
}
const slabOverrides = new Map<string, SlabOverride>();

// Per-joint overrides — persist across sketch re-runs (which otherwise
// rebuild the WallSystem from scratch and revert to WallType defaults).
const jointStyleOverride   = new Map<number, "mitered" | "butt">();
const jointThroughOverride = new Map<number, string>();

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    // ── Wall envelope ──
    const thickness = lab.slider("Thickness (m)", 0.10, 0.40, 0.14, { step: 0.005, group: "Wall" });
    const height    = lab.slider("Height (m)",    2.0,  4.0,  2.7,  { step: 0.05,  group: "Wall" });

    // ── Door / window openings ──
    const doorWidth = lab.slider("Door width (m)",    0.7, 1.5, 0.9, { step: 0.05, group: "Door" });
    const doorHead  = lab.slider("Door head (m)",     1.9, 2.4, 2.1, { step: 0.05, group: "Door" });

    const winWidth  = lab.slider("Window width (m)",    0.5, 2.4, 1.2, { step: 0.05, group: "Window" });
    const winSill   = lab.slider("Window sill (m)",     0.4, 1.4, 0.9, { step: 0.05, group: "Window" });
    const winHead   = lab.slider("Window head (m)",     1.8, 2.4, 2.1, { step: 0.05, group: "Window" });

    // ── Construction system ──
    const sys = lab.select(
      "Construction",
      ["BalloonFrame (NA 2×4)", "Holzrahmenbau (DE KVH 60×120)"],
      "Holzrahmenbau (DE KVH 60×120)",
      { group: "Construction" },
    );
    const isHRB = sys.value.startsWith("Holzrahmenbau");

    const studSpacing  = lab.slider(
      isHRB ? "Stud spacing — Achsabstand (m)" : "Stud spacing (m)",
      0.3, 0.8, isHRB ? 0.625 : 0.4,
      { step: 0.025, group: "Construction" },
    );
    const studDepth = lab.slider(
      isHRB ? "Stud depth — Tiefe (mm)" : "Stud depth (mm)",
      80, 240, isHRB ? 120 : 89,
      { step: 1, group: "Construction" },
    );
    const studWidth = lab.slider(
      isHRB ? "Stud width — Breite (mm)" : "Stud thickness (mm)",
      38, 80, isHRB ? 60 : 38,
      { step: 1, group: "Construction" },
    );
    const topPlates = lab.toggle(
      isHRB ? "Doppeltes Rähm" : "Doubled top plate",
      !isHRB,
      { group: "Construction" },
    );

    // ── Storeys ──
    // Stack this room N times vertically. Each storey gets the same wall
    // shell + its own floor slab; the topmost storey also gets a roof.
    const storeyCount = lab.slider("Storeys", 1, 4, 1, { step: 1, group: "Storeys" });

    // ── Slabs ──
    const showFloor       = lab.toggle("Show floor slab",   true,  { group: "Slabs" });
    const showCeiling     = lab.toggle("Show ceiling slab (top)", true,  { group: "Slabs" });
    const slabThickness   = lab.slider("Slab thickness (m)", 0.18, 0.40, 0.28, { step: 0.01, group: "Slabs" });
    const slabJoistSpacing = lab.slider("Joist spacing (m)", 0.30, 0.80, 0.625, { step: 0.025, group: "Slabs" });
    const slabJoistDepth  = lab.slider("Joist depth (mm)",  140, 320, 220, { step: 10, group: "Slabs" });
    const orientMethod    = lab.select(
      "Joist orientation",
      ["Auto (support-driven)", "Bounding-box"],
      "Auto (support-driven)",
      { group: "Slabs" },
    );

    // ── Display ──
    // (Sun position is driven by the top-bar Sun ▾ popover — date,
    // location, hour. The shell pushes `setSunDirection` automatically
    // on every page load and on any change.)
    const showFraming  = lab.toggle("Show framing",         true,  { group: "Display" });
    const showEnvelope = lab.toggle("Show envelope (ghost)", false, { group: "Display" });
    const showLog      = lab.toggle("Show cut list",         false, { group: "Display" });

    // Export is registered AFTER the slabs section below so the closure
    // can capture `numStoreys`, `wallSystem`, `floor`, `ceiling`, etc.
    // without hitting their temporal-dead-zone. Search for "Export IFC".

    // ── Room corners (drag handles) ──
    const swH = lab.dragHandle(0, 0, 0, { name: "room.SW", color: "#38d9a9" });
    const seH = lab.dragHandle(5, 0, 0, { name: "room.SE", color: "#38d9a9" });
    const neH = lab.dragHandle(5, 4, 0, { name: "room.NE", color: "#38d9a9" });
    const nwH = lab.dragHandle(0, 4, 0, { name: "room.NW", color: "#38d9a9" });
    const sw = new Vec2(swH.value.x, swH.value.y);
    const se = new Vec2(seH.value.x, seH.value.y);
    const ne = new Vec2(neH.value.x, neH.value.y);
    const nw = new Vec2(nwH.value.x, nwH.value.y);

    // ── Wall type ──
    const studProfile  = { w: studWidth.value / 1000, h: studDepth.value / 1000, name: isHRB ? "KVH" : "SPF" };
    const plateProfile = studProfile;

    let construction: WallConstruction;
    let wallType: WallType;
    if (isHRB) {
      construction = HolzrahmenBau({
        studSpacing: studSpacing.value,
        studProfile, plateProfile,
        topPlateCount: topPlates.value ? 2 : 1,
        material: "KVH C24",
      });
      wallType = new WallType({
        name: "Holzrahmenbau KVH",
        construction,
        layers: holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: studDepth.value / 1000 } }),
        properties: { loadBearing: true, isExternal: true, fireRating: "REI60", uValue: 0.18 },
        junctionStyle: "butt",      // prefab panel default
      });
    } else {
      construction = BalloonFrame({
        studSpacing: studSpacing.value,
        studProfile, plateProfile,
        topPlateCount: topPlates.value ? 2 : 1,
        material: "SPF",
      });
      wallType = new WallType({
        name: "2×4 framed",
        construction,
        layers: [
          { material: "OSB 11 mm",    thickness: 0.011, position: "exterior" },
          { material: "Gypsum 13 mm", thickness: 0.013, position: "interior" },
        ],
        properties: { loadBearing: true, isExternal: true, fireRating: "1hr" },
        junctionStyle: "mitered",   // site-built default
      });
    }

    // ── Four perimeter walls ──
    const southWall = new Wall({ centerline: [sw, se], thickness: thickness.value, height: height.value, name: "South",  type: wallType });
    const eastWall  = new Wall({ centerline: [se, ne], thickness: thickness.value, height: height.value, name: "East",   type: wallType });
    const northWall = new Wall({ centerline: [ne, nw], thickness: thickness.value, height: height.value, name: "North",  type: wallType });
    const westWall  = new Wall({ centerline: [nw, sw], thickness: thickness.value, height: height.value, name: "West",   type: wallType });

    const perimeterCW: { wall: Wall; startArc: number }[] = [
      { wall: southWall, startArc: 0 },
      { wall: eastWall,  startArc: southWall.length },
      { wall: northWall, startArc: southWall.length + eastWall.length },
      { wall: westWall,  startArc: southWall.length + eastWall.length + northWall.length },
    ];
    const roomLoop = [sw, se, ne, nw, sw];

    // ── Opening drag handles (snap to the loop) ──
    const snapToLoop = (x: number, y: number, z: number): [number, number, number] => {
      const proj = Polygon2D.closestPointOnPolyline(roomLoop, new Vec2(x, y), { closed: true });
      return [proj.point.x, proj.point.y, z];
    };
    const doorHandle = lab.dragHandle(1.5, 0, 0,                          { name: "opening.door",   color: "#ff6b6b", size: 0.18, constrain: snapToLoop });
    const winInitArc = southWall.length + eastWall.length + 2.5;
    const winInit    = pointAtArcLength(roomLoop, winInitArc);
    const winHandle  = lab.dragHandle(winInit.x, winInit.y, 0,           { name: "opening.window", color: "#4dabf7", size: 0.18, constrain: snapToLoop });

    placeOpeningOnPerimeter(doorHandle.value, perimeterCW, roomLoop, new WallOpening(0, doorWidth.value, 0, doorHead.value, "D1"));
    placeOpeningOnPerimeter(winHandle.value,  perimeterCW, roomLoop, new WallOpening(0, winWidth.value, winSill.value, winHead.value, "W1"));

    // ── Interior partition ──
    const eastMid = new Vec2((se.x + ne.x) * 0.5, (se.y + ne.y) * 0.5);
    const spurEnd = lab.dragHandle(2, 2, 0, { name: "spur.end", color: "#ffd166", size: 0.18 });
    const interior = new Wall({
      centerline: [eastMid, new Vec2(spurEnd.value.x, spurEnd.value.y)],
      thickness: thickness.value, height: height.value,
      name: "Interior partition", type: wallType,
    });

    // ── Build system ──
    const wallSystem = new WallSystem([southWall, eastWall, northWall, westWall, interior]);
    // Force the joint cache to populate so we can render markers.
    const joints = wallSystem.joints;

    // Apply any user-set per-joint overrides (style + throughWall) so they
    // survive the sketch re-runs that rebuild the WallSystem from scratch.
    for (let i = 0; i < joints.length; i++) {
      const wj = joints[i];
      const so = jointStyleOverride.get(i);
      if (so) wj.style = so;
      const tn = jointThroughOverride.get(i);
      if (tn) {
        const w = wj.walls.find(x => (x.name ?? "") === tn);
        if (w) wj.throughWall = w;
      }
    }

    // ── Joint markers (click-to-select) ──
    // One small sphere at every joint position. Color encodes current style
    // (gold = butt, blue = mitered). Constrained to its own position so it
    // doesn't drag — left-click just selects.
    for (let i = 0; i < joints.length; i++) {
      const wj = joints[i];
      const p  = wj.ribbonJoint.point;
      const styleColor = wj.style === "butt" ? "#ffd700" : "#4dabf7";
      const lockedPos: [number, number, number] = [p.x, p.y, 0.3];
      lab.dragHandle(p.x, p.y, 0.3, {
        name: `joint.${i}`, color: styleColor, size: 0.14,
        constrain: () => lockedPos,
      });
    }

    // (Joint style / through-wall controls now live inside the info panel
    //  itself — see syncInfoPanel below.)

    // ── Render ──
    // Per-wall envelope (always present — always pickable; visual opacity
    // depends on the display toggles). Each gets `wall:<name>` label so
    // the info panel can identify the picked wall. The currently-selected
    // wall is tinted teal so it's clearly visible regardless of toggles.
    const allWalls = [southWall, eastWall, northWall, westWall, interior];
    for (const w of allWalls) {
      const m = w.toMesh();
      const isPicked = w.name === pickedWallName;
      const baseOpacity = showEnvelope.value
        ? (showFraming.value ? 0.18 : 1.0)
        : 0.001;
      const color   = isPicked ? "#38d9a9" : "#cfd8dc";
      const opacity = isPicked ? Math.max(baseOpacity, 0.35) : baseOpacity;
      lab.flatMesh({ positions: m.positions, normals: m.normals, indices: m.indices })
        .color(color).opacity(opacity).label(`wall:${w.name}`);
    }

    let cutList: ReturnType<typeof buildCutList> = [];
    if (showFraming.value) {
      const realised = wallSystem.realize();
      for (const r of realised) {
        const wallName = r.wall.name ?? "?";
        for (const p of r.parts) {
          // Label = `wall:<name>:<part>` so picking any framing piece still
          // identifies the parent wall in framing-only mode.
          lab.flatMesh({ positions: p.mesh.positions, normals: p.mesh.normals, indices: p.mesh.indices })
            .color(colorForRole(p.role)).label(`wall:${wallName}:${p.name}`);
        }
        cutList = cutList.concat(buildCutList(r.parts));
      }
    }

    // ── Slabs (floor + ceiling) ──────────────────────────────────────
    // Slab boundary = wall CENTERLINE polygon. The rim joist sits inset
    // by half its width (so its outer face is on the wall centerline);
    // the regular joists are inset further by `rim + bearingGap`, so
    // their HEADS land at the wall INNER face — flush with the room
    // side of the wall, never embedded inside the wall body.
    const supports = [southWall, eastWall, northWall, westWall];
    const slabBoundary = [sw, se, ne, nw, sw];

    /** Build one slab using its per-instance overrides + render its parts. */
    const buildAndRender = (name: string, topZ: number): { slab: Slab; joistDir: Vec2; spacing: number; depth: number; edgeOffset: number; bearingGap: number } | null => {
      const ov = slabOverrides.get(name) ?? {};
      const thickness  = ov.thickness     ?? slabThickness.value;
      const spacing    = ov.joistSpacing  ?? slabJoistSpacing.value;
      const depth      = ov.joistDepth    ?? slabJoistDepth.value;
      const edgeOffset = ov.edgeOffset    ?? spacing * 0.5;
      const bearingGap = ov.bearingGap    ?? 0.010;
      const method     = ov.orientationMethod ?? orientMethod.value;
      const joistDir   = method === "Bounding-box"
        ? chooseJoistDirection(new Slab({ boundary: slabBoundary }), { method: "bbox" })
        : chooseJoistDirection(new Slab({ boundary: slabBoundary }), { method: "supports", supports });

      const slabType = new SlabType({
        name: "Timber joist slab",
        construction: JoistedSlab({
          spacing,
          profile: { w: 0.06, h: depth / 1000, name: "KVH" },
          material: "KVH C24",
          edgeOffset,
          bearingGap,
        }),
        properties: { loadBearing: true, fireRating: "REI60" },
      });

      const slab = new Slab({
        boundary: slabBoundary,
        thickness,
        elevation: topZ,
        name,
        type: slabType,
        joistDirection: joistDir,
      });

      const parts = slabType.construction!(slab, { joistDirection: joistDir, supports });
      for (const p of parts) {
        lab.flatMesh({ positions: p.mesh.positions, normals: p.mesh.normals, indices: p.mesh.indices })
          .color(colorForSlabRole(p.role))
          .label(`slab:${name}:${p.name}`);
      }
      return { slab, joistDir, spacing, depth, edgeOffset, bearingGap };
    };

    // Vertical step per storey = wall height + floor-slab thickness.
    const slabT = slabOverrides.get("Floor")?.thickness ?? slabThickness.value;
    const storeyHeight = height.value + slabT;
    const numStoreys = Math.max(1, Math.round(storeyCount.value));

    // ── Foundation slab — at the base of storey 0 (top of slab at z = 0). ──
    const foundation = showFloor.value ? buildAndRender("Floor", 0) : null;

    // ── Upper storeys: clone walls + add intermediate slab between each pair. ──
    // For storey s ≥ 1, the slab is at z = s * storeyHeight (top of slab),
    // which is simultaneously the ceiling of storey s−1 and the floor of
    // storey s. By IFC convention it's the floor-of, so it belongs to
    // storey s.
    type UpperStorey = {
      storeyIndex: number;
      walls: Wall[];
      system: WallSystem;
      slab: ReturnType<typeof buildAndRender>;
    };
    const upperStoreys: UpperStorey[] = [];
    for (let s = 1; s < numStoreys; s++) {
      const baseZ = s * storeyHeight;
      const clones = [southWall, eastWall, northWall, westWall, interior].map(w =>
        new Wall({
          centerline: w.centerline,
          thickness: w.thickness, height: w.height,
          name: `${w.name}_S${s}`, type: w.type,
          baseElevation: baseZ,
        }));
      const clonedSystem = new WallSystem(clones);

      // Envelope (pickable, same opacity logic as storey 0).
      for (const w of clones) {
        const m = w.toMesh();
        const baseOpacity = showEnvelope.value
          ? (showFraming.value ? 0.18 : 1.0)
          : 0.001;
        lab.flatMesh({ positions: m.positions, normals: m.normals, indices: m.indices })
          .color("#cfd8dc").opacity(baseOpacity).label(`wall:${w.name}`);
      }

      // Framing.
      if (showFraming.value) {
        const realised = clonedSystem.realize();
        for (const r of realised) {
          const wallName = r.wall.name ?? "?";
          for (const p of r.parts) {
            lab.flatMesh({ positions: p.mesh.positions, normals: p.mesh.normals, indices: p.mesh.indices })
              .color(colorForRole(p.role)).label(`wall:${wallName}:${p.name}`);
          }
        }
      }

      const slab = buildAndRender(`Floor S${s}`, baseZ);
      if (slab) upperStoreys.push({ storeyIndex: s, walls: clones, system: clonedSystem, slab });
    }

    // ── Roof slab — at the top of the topmost storey. ──
    const ceiling = showCeiling.value
      ? buildAndRender("Ceiling", numStoreys * storeyHeight)
      : null;
    const floor = foundation;
    const floorSlab   = floor?.slab   ?? null;
    const ceilingSlab = ceiling?.slab ?? null;
    const allSlabs    = [
      floorSlab,
      ...upperStoreys.map(u => u.slab?.slab ?? null),
      ceilingSlab,
    ].filter((s): s is Slab => s !== null);

    // ── Export IFC — top-bar menu (Export ▾ → IFC) ────────────────────
    // Registered here (after the slabs/upperStoreys are defined) so the
    // handler closure can read `numStoreys`, `wallSystem`, `floor`, etc.
    // The sketch re-runs on every parameter change; re-registering with
    // the same name (`"IFC"`) just refreshes the handler closure so the
    // current values are always exported.
    lab.registerExport({
      name:     "IFC",
      fileName: `model-${numStoreys}storey.ifc`,
      mimeType: "application/ifc",
      handler:  () => {
        const writer = new IfcWriter({
          projectName: `Tekto ${numStoreys}-storey demo`,
          buildingName: `${numStoreys}-storey demo building`,
          storeyName: "Ground floor",
          storeyElevation: 0,
          author: "Tekto",
          application: "Tekto",
          applicationVersion: "0.2",
        });
        const groundStoreyRef = writer.getDefaultStorey();
        writer.addWallSystem(wallSystem, {
          storey: groundStoreyRef,
          includeMembers:   true,
          includeOpenings:  true,
          includeMaterials: true,
          includeJoints:    true,
        });
        if (floor) {
          writer.addSlab(floor.slab, {
            predefinedType: "FLOOR",
            storey: groundStoreyRef,
            parts: floor.slab.type!.construction!(floor.slab, { joistDirection: floor.joistDir, supports }),
          });
        }
        const ordinal = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
        const storeyRefs: number[] = [groundStoreyRef];
        for (const u of upperStoreys) {
          const name = `${ordinal[u.storeyIndex - 1] ?? `Storey ${u.storeyIndex}`} floor`;
          const ref = writer.addStorey({ name, elevation: u.storeyIndex * storeyHeight });
          storeyRefs.push(ref);
          writer.addWallSystem(u.system, {
            storey: ref,
            includeMembers:   true,
            includeOpenings:  false,
            includeMaterials: true,
            includeJoints:    true,
          });
          if (u.slab) {
            writer.addSlab(u.slab.slab, {
              predefinedType: "FLOOR",
              storey: ref,
              parts: u.slab.slab.type!.construction!(u.slab.slab, { joistDirection: u.slab.joistDir, supports }),
            });
          }
        }
        if (ceiling) {
          const topStorey = storeyRefs[storeyRefs.length - 1];
          writer.addSlab(ceiling.slab, {
            predefinedType: "ROOF",
            storey: topStorey,
            parts: ceiling.slab.type!.construction!(ceiling.slab, { joistDirection: ceiling.joistDir, supports }),
          });
        }
        return writer.saveBlob();
      },
    });

    // Enable mesh picking. Labels of pickable meshes are `wall:<name>` for
    // envelopes, `wall:<name>:<partName>` for framing parts, or
    // `slab:<name>[:<partName>]` for slabs. Either way, we extract the
    // domain prefix (wall / slab) and the first segment after it.
    lab.enablePicking(true);
    lab.onPick((id) => {
      if (!id) { pickedWallName = null; pickedSlabName = null; return; }
      const obj = lab.getScene().get(id);
      const label = obj?.style?.label ?? "";
      if (label.startsWith("wall:")) {
        pickedWallName = label.slice("wall:".length).split(":")[0];
        pickedSlabName = null;
      } else if (label.startsWith("slab:")) {
        pickedSlabName = label.slice("slab:".length).split(":")[0];
        pickedWallName = null;
      } else {
        pickedWallName = null;
        pickedSlabName = null;
      }
    });
    // Clicking any handle is a different selection — clear the wall + slab
    // picks so the info panel snaps to the handle.
    lab.onHandlePick(() => { pickedWallName = null; pickedSlabName = null; });

    // ── Info panel (top-right) ──
    // Reflects whatever is currently selected: wall, opening, joint, corner,
    // spur endpoint. Updates every sketch re-run.
    const sel = lab.selectedHandle;
    let infoTitle = "—";
    let infoBody: ({ label: string; value: string } | { control: HTMLElement })[] = [];

    if (sel && sel.startsWith("joint.")) {
      const i = parseInt(sel.split(".")[1], 10);
      const j = joints[i];
      if (j) {
        infoTitle = `${j.kind}-joint #${i}`;
        infoBody = [
          { label: "Walls",   value: j.walls.map(w => w.name ?? "?").join(" + ") },
          { control: makeSelectRow("Style", ["mitered", "butt"], j.style, (v) => {
              const newStyle = v as "mitered" | "butt";
              jointStyleOverride.set(i, newStyle);
              j.style = newStyle;
              lab.invalidate();
            }) },
        ];
        if (j.kind === "L" && j.style === "butt") {
          const opts = j.walls.map(w => w.name ?? "(unnamed)");
          const cur = j.throughWall?.name ?? opts[0];
          infoBody.push({ control: makeSelectRow("Through", opts, cur, (v) => {
            jointThroughOverride.set(i, v);
            const w = j.walls.find(x => (x.name ?? "(unnamed)") === v);
            if (w) j.throughWall = w;
            lab.invalidate();
          }) });
        }
      }
    } else if (sel === "opening.door") {
      const doorWall = allWalls.find(w => w.openings.some(o => o.name === "D1"));
      const op = doorWall?.openings.find(o => o.name === "D1");
      infoTitle = "Door  D1";
      infoBody = op ? [
        { label: "On wall",   value: doorWall!.name ?? "?" },
        { label: "Position",  value: `${op.centerlinePosition.toFixed(2)} m` },
        { label: "Width",     value: `${op.width.toFixed(2)} m` },
        { label: "Head",      value: `${op.headHeight.toFixed(2)} m` },
        { label: "Sill",      value: `${op.sillHeight.toFixed(2)} m` },
      ] : [];
    } else if (sel === "opening.window") {
      const winWall = allWalls.find(w => w.openings.some(o => o.name === "W1"));
      const op = winWall?.openings.find(o => o.name === "W1");
      infoTitle = "Window  W1";
      infoBody = op ? [
        { label: "On wall",   value: winWall!.name ?? "?" },
        { label: "Position",  value: `${op.centerlinePosition.toFixed(2)} m` },
        { label: "Width",     value: `${op.width.toFixed(2)} m` },
        { label: "Sill",      value: `${op.sillHeight.toFixed(2)} m` },
        { label: "Head",      value: `${op.headHeight.toFixed(2)} m` },
      ] : [];
    } else if (sel?.startsWith("room.")) {
      const corner = sel.slice("room.".length);
      const v = corner === "SW" ? sw : corner === "SE" ? se : corner === "NE" ? ne : nw;
      infoTitle = `Corner  ${corner}`;
      infoBody = [
        { label: "X (m)",     value: v.x.toFixed(3) },
        { label: "Y (m)",     value: v.y.toFixed(3) },
      ];
    } else if (sel === "spur.end") {
      infoTitle = "Spur endpoint";
      infoBody = [
        { label: "Wall",      value: interior.name ?? "?" },
        { label: "X (m)",     value: spurEnd.value.x.toFixed(3) },
        { label: "Y (m)",     value: spurEnd.value.y.toFixed(3) },
        { label: "Length",    value: `${interior.length.toFixed(2)} m` },
      ];
    } else if (pickedWallName) {
      const w = allWalls.find(x => x.name === pickedWallName);
      if (w) {
        infoTitle = `Wall  ${w.name}`;
        infoBody = [
          { label: "Type",      value: w.type?.name ?? "—" },
          { label: "Thickness", value: `${w.thickness.toFixed(3)} m` },
          { label: "Height",    value: `${w.height.toFixed(2)} m` },
          { label: "Length",    value: `${w.length.toFixed(2)} m` },
          { label: "Openings",  value: String(w.openings.length) },
          ...(w.type?.junctionStyle
            ? [{ label: "Joint style (default)", value: w.type.junctionStyle }]
            : []),
        ];
      }
    } else if (pickedSlabName) {
      const slabInfo = pickedSlabName === "Floor" ? floor : pickedSlabName === "Ceiling" ? ceiling : null;
      if (slabInfo) {
        const s = slabInfo.slab;
        const angle = (Math.atan2(slabInfo.joistDir.y, slabInfo.joistDir.x) * 180 / Math.PI).toFixed(1);
        const ov = () => { const o = slabOverrides.get(s.name!) ?? {}; slabOverrides.set(s.name!, o); return o; };

        infoTitle = `Slab  ${s.name}`;
        infoBody = [
          { label: "Type",          value: s.type?.name ?? "—" },
          { label: "Area",          value: `${s.area.toFixed(2)} m²` },
          { label: "Top elevation", value: `${s.elevation.toFixed(2)} m` },
          { label: "Joist dir",     value: `${angle}°` },
          { control: makeNumberRow(
              "Thickness", 0.18, 0.40, 0.01, s.thickness,
              v => `${v.toFixed(2)} m`,
              v => { ov().thickness = v; lab.invalidate(); },
            ) },
          { control: makeNumberRow(
              "Spacing", 0.30, 0.80, 0.025, slabInfo.spacing,
              v => `${(v * 1000).toFixed(0)} mm`,
              v => { ov().joistSpacing = v; lab.invalidate(); },
            ) },
          { control: makeNumberRow(
              "Depth", 140, 320, 10, slabInfo.depth,
              v => `${v.toFixed(0)} mm`,
              v => { ov().joistDepth = v; lab.invalidate(); },
            ) },
          { control: makeNumberRow(
              "Edge offset", 0.05, 1.0, 0.025, slabInfo.edgeOffset,
              v => `${(v * 1000).toFixed(0)} mm`,
              v => { ov().edgeOffset = v; lab.invalidate(); },
            ) },
          { control: makeNumberRow(
              "Bearing gap", 0, 0.05, 0.001, slabInfo.bearingGap,
              v => `${(v * 1000).toFixed(0)} mm`,
              v => { ov().bearingGap = v; lab.invalidate(); },
            ) },
          { control: makeSelectRow(
              "Orientation",
              ["Auto (support-driven)", "Bounding-box"],
              slabOverrides.get(s.name!)?.orientationMethod ?? orientMethod.value,
              v => { ov().orientationMethod = v; lab.invalidate(); },
            ) },
        ];
      }
    }

    syncInfoPanel(lab, infoTitle, infoBody);

    // ── Info / log ──
    const jointSummary = joints.map(j => `${j.kind}:${j.style}`).join(" · ");
    const totalLen = cutList.reduce((s, c) => s + c.length * c.count, 0);
    const totalCount = cutList.reduce((s, c) => s + c.count, 0);
    lab.info(
      `${isHRB ? "Holzrahmenbau (butt joints)" : "Balloon-frame (mitered joints)"} · `
      + `${studWidth.value}×${studDepth.value} mm @ ${(studSpacing.value * 1000).toFixed(0)} mm o.c. · `
      + `${totalCount} pieces · ${totalLen.toFixed(1)} m. `
      + `Joints: ${jointSummary || "—"}.`,
    );
    if (showLog.value && cutList.length > 0) {
      lab.log("Cut list", "");
      for (const c of cutList) {
        lab.log(
          `  ${c.role.padEnd(10, " ")}`,
          `${c.count.toString().padStart(3, " ")} × ${c.length.toFixed(2)} m  ${c.profile.name ?? ""}`,
        );
      }
    }
  }, {
    container,
    title: "Walls — first-class joints (mitered ↔ butt)",
    background: 0x0a0b14,
    up: "z",
    panelWidth: 380,
    camera: [10, -10, 9],
    target: [4, 2, 1],
  });
}

