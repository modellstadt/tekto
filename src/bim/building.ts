/**
 * A building as data: storeys, walls, openings, slabs, spaces, roofs and stairs as plain JSON
 * records that reference each other by id. A person, a script or an agent writes the records (into a `Doc`,
 * so they are saved, undone and shared); `realizeBuilding` turns them into the BIM elements
 * (`Wall`, `WallSystem`, `Slab`, `Space`, `Roof`, `Stair`), `check()` says what is wrong by record, `toIfc()`
 * writes the file, and `bindBuilding` keeps a scene in step with a document.
 *
 *   const building = realizeBuilding({
 *     storeys: { eg: { name: "Ground floor", elevation: 0, height: 2.9 } },
 *     walls:   { s: { storey: "eg", path: [[0, 0], [10, 0]] } },
 *     openings: { d: { wall: "s", kind: "door", at: 3, width: 1 } },
 *   });
 *   building.check();     // [{ severity: "warning", code: "wall-end-free", key: "walls/s", … }]
 *   building.toIfc();     // the IFC file
 *
 * Z-up, metres. A wall's `type`, a slab's `type` and an opening's `type` name an entry in the
 * `BuildingTypes` (default `defaultBuildingTypes()`: timber-frame walls and joisted floors).
 * `BUILDING_SCHEMA` is the JSON Schema of each collection: what `validateBuilding` checks,
 * and what an agent's tool takes as its input.
 */
import { Vec2, Vec3 } from "../core/math/vectors";
import { Polygon2D } from "../core/geometry/Polygon2D";
import { PolygonBool } from "../core/geometry/PolygonBool";
import { Wall, WallOpening, WallSystem } from "../core/geometry/walls";
import { Mesh } from "../core/geometry/mesh/Mesh";
import { WallType, type RealizedWall } from "./walls/types";
import { HolzrahmenBau, HolzrahmenBauJointStyle, holzrahmenbauLayers } from "./walls/holzrahmenbau";
import { SolidConstruction } from "./walls/solid";
import { Slab, SlabOpening, SlabType, realizeSlab } from "./slabs/types";
import { JoistedSlab } from "./slabs/joisted";
import { SolidSlabConstruction } from "./slabs/solid";
import { joistDirectionFromBounds } from "./slabs/orientation";
import { Space, boundingWalls } from "./spaces";
import { OpeningType, openingFill } from "./openings";
import { Roof } from "./roofs";
import { Stair, StairType } from "./stairs";
import { IfcWriter } from "../io/IfcWriter";
import { checkRecord, type RecordSchema } from "../collab/recordSchema";
import type { Doc } from "../collab/Doc";
import type { Scene } from "../scene/Scene";

// ── Records ────────────────────────────────────────────────────────────────────

/** A point in the ground plane, `[x, y]` in metres. */
export type XY = [number, number];

/** A storey: the level its walls stand on, and the height to the next one. */
export interface StoreyRecord {
  name: string;
  /** Top of this storey's floor, where its walls stand (world Z, m). */
  elevation: number;
  /** Floor to floor: from this storey's floor to the next storey's floor (m). */
  height: number;
}

/** A wall on a storey, along a centreline. */
export interface WallRecord {
  /** The storey's id. */
  storey: string;
  /** Centreline, two or more points; a closed loop repeats its first point. */
  path: XY[];
  /** A wall type of the `BuildingTypes` (default "exterior"). */
  type?: string;
  /** Overrides the type's thickness (m). */
  thickness?: number;
  /** Overrides the height: by default up to the underside of the floor above (m). */
  height?: number;
  name?: string;
}

/** A door or window in a wall. */
export interface OpeningRecord {
  /** The wall's id. */
  wall: string;
  kind: "door" | "window";
  /** Where its centre is: the distance along the wall's path from its first point (m). */
  at: number;
  width: number;
  /** Bottom above the wall's base (m); default 0 for a door, 0.9 for a window. */
  sill?: number;
  /** Top above the wall's base (m); default 2.1 for a door, 2.2 for a window. */
  head?: number;
  /** An opening type of the `BuildingTypes` (default: the kind, "door" or "window"). */
  type?: string;
  name?: string;
}

/** A rectangular hole in a slab (a stair well, a shaft): centre and size along world X and Y. */
export interface SlabOpeningRecord {
  x: number;
  y: number;
  /** Along world X (m). */
  width: number;
  /** Along world Y (m). */
  depth: number;
  name?: string;
}

/** A slab: the floor of a storey (its top at the storey's elevation), or the top of one (a flat roof). */
export interface SlabRecord {
  /** The storey's id. */
  storey: string;
  /** Footprint, three or more points (not repeating the first). */
  boundary: XY[];
  /** "floor" (default): its top is the storey's elevation. "top": its top is the storey's top, a flat roof. */
  level?: "floor" | "top";
  /** A slab type of the `BuildingTypes` (default "floor"). */
  type?: string;
  /** Overrides the type's thickness (m). */
  thickness?: number;
  openings?: SlabOpeningRecord[];
  name?: string;
}

/** A room on a storey. */
export interface SpaceRecord {
  /** The storey's id. */
  storey: string;
  name: string;
  /** Floor outline, three or more points (not repeating the first). */
  boundary: XY[];
  /**
   * What the room is for: "living", "kitchen", "bedroom", "bath", "hall" … Lower-cased, it names
   * a space type of the `BuildingTypes` (its colour, whether it needs daylight or a door); any other use is fine too.
   */
  use?: string;
}

/** A roof on a storey's walls: its eaves sit on their top. */
export interface RoofRecord {
  /** The storey it covers. */
  storey: string;
  kind: "flat" | "shed" | "gable" | "hip";
  /**
   * The outside face of the walls under it. For a shed, gable or hip roof a rectangle whose
   * first edge is an eave: a gable's ridge runs along it, a shed is low on it. A flat roof takes any outline.
   */
  footprint: XY[];
  /** Degrees; default 30 (0 for flat). */
  pitch?: number;
  /** Past the walls at the eaves (m); default 0.5. */
  overhang?: number;
  /** Past the gable walls (m); default the overhang. */
  gableOverhang?: number;
  /** Build-up (m); default 0.3. */
  thickness?: number;
  name?: string;
}

/** A stair from a storey's floor to the next storey's floor. */
export interface StairRecord {
  /** The storey it starts on: it climbs that storey's height. */
  storey: string;
  /** Centre of the first flight's width at its first riser. */
  at: XY;
  /** Which way the first flight climbs; default [1, 0]. */
  direction?: XY;
  /** Default "straight_run"; "quarter_turn" (L) and "half_turn" (U) have a landing. */
  shape?: "straight_run" | "two_straight_run" | "quarter_turn" | "half_turn";
  /** Which way an L or U turns, seen walking up; default "left". */
  turn?: "left" | "right";
  /** Flight width (m); default 1.0. */
  width?: number;
  /** Target riser height (m); default 0.18, the actual one divides the storey height evenly. */
  riser?: number;
  /** Tread depth (m); default 0.27. */
  going?: number;
  /** Landing depth (m); default the width. */
  landingDepth?: number;
  /** Gap between the flights of a U (m); default 0.1. */
  gap?: number;
  /** Cut the well in the floor above; default true. */
  well?: boolean;
  name?: string;
}

/** The collections of a building and the record each holds: a `Doc` schema (`new Doc<BuildingRecords>`). */
export type BuildingRecords = {
  storeys: StoreyRecord;
  walls: WallRecord;
  openings: OpeningRecord;
  slabs: SlabRecord;
  spaces: SpaceRecord;
  roofs: RoofRecord;
  stairs: StairRecord;
};

/** A building's collection names. */
export type BuildingCollection = keyof BuildingRecords;

/** A building as data: each collection maps record ids to records, as `doc.toJSON().collections` holds them. */
export type BuildingData = { [C in BuildingCollection]?: Record<string, BuildingRecords[C]> };

/** The building's collections, in the order they depend on each other. */
export const BUILDING_COLLECTIONS: readonly BuildingCollection[] = ["storeys", "walls", "openings", "slabs", "spaces", "roofs", "stairs"];

const POINT: RecordSchema = { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2, description: "[x, y] in metres" };
const LENGTH = (description: string): RecordSchema => ({ type: "number", exclusiveMinimum: 0, description });

/**
 * The JSON Schema of each building collection, for the default types: what `validateBuilding`
 * checks and what an agent's tool takes as input. References between records (`storey`,
 * `wall`) are checked by `validateBuilding`. `buildingSchema(types)` gives it for other types.
 */
export const BUILDING_SCHEMA: Record<BuildingCollection, RecordSchema> = {
  storeys: {
    type: "object", additionalProperties: false, required: ["name", "elevation", "height"],
    description: "A storey: the level its walls stand on and the height to the next storey.",
    properties: {
      name: { type: "string" },
      elevation: { type: "number", description: "Top of this storey's floor, where its walls stand (m)" },
      height: LENGTH("Floor to floor height (m)"),
    },
  },
  walls: {
    type: "object", additionalProperties: false, required: ["storey", "path"],
    description: "A wall along a centreline on a storey.",
    properties: {
      storey: { type: "string", description: "The storey's id: \"eg\" for \"storeys/eg\"" },
      path: { type: "array", items: POINT, minItems: 2, description: "Centreline points [x, y]; a closed loop repeats its first point" },
      type: { type: "string", description: "Wall type name, default \"exterior\"" },
      thickness: LENGTH("Overrides the type's thickness (m)"),
      height: LENGTH("Overrides the height; default up to the underside of the floor above (m)"),
      name: { type: "string" },
    },
  },
  openings: {
    type: "object", additionalProperties: false, required: ["wall", "kind", "at", "width"],
    description: "A door or window in a wall.",
    properties: {
      wall: { type: "string", description: "The wall's id: \"s\" for \"walls/s\"" },
      kind: { type: "string", enum: ["door", "window"] },
      at: { type: "number", minimum: 0, description: "Centre: distance along the wall's path from its first point (m)" },
      width: LENGTH("Width (m)"),
      sill: { type: "number", minimum: 0, description: "Bottom above the wall's base (m); default door 0, window 0.9" },
      head: LENGTH("Top above the wall's base (m); default door 2.1, window 2.2"),
      type: { type: "string", description: "Opening type name, default the kind" },
      name: { type: "string" },
    },
  },
  slabs: {
    type: "object", additionalProperties: false, required: ["storey", "boundary"],
    description: "A slab: a storey's floor (top at its elevation) or its top (a flat roof).",
    properties: {
      storey: { type: "string", description: "The storey's id: \"eg\" for \"storeys/eg\"" },
      boundary: { type: "array", items: POINT, minItems: 3, description: "Footprint points [x, y], not repeating the first" },
      level: { type: "string", enum: ["floor", "top"], description: "\"floor\" (default) or \"top\" (a flat roof)" },
      type: { type: "string", description: "Slab type name, default \"floor\"" },
      thickness: LENGTH("Overrides the type's thickness (m)"),
      openings: {
        type: "array", description: "Rectangular holes (stair wells)",
        items: {
          type: "object", additionalProperties: false, required: ["x", "y", "width", "depth"],
          properties: {
            x: { type: "number", description: "Centre x (m)" }, y: { type: "number", description: "Centre y (m)" },
            width: LENGTH("Along world X (m)"), depth: LENGTH("Along world Y (m)"), name: { type: "string" },
          },
        },
      },
      name: { type: "string" },
    },
  },
  spaces: {
    type: "object", additionalProperties: false, required: ["storey", "name", "boundary"],
    description: "A room on a storey.",
    properties: {
      storey: { type: "string", description: "The storey's id: \"eg\" for \"storeys/eg\"" },
      name: { type: "string" },
      boundary: { type: "array", items: POINT, minItems: 3, description: "Floor outline [x, y], not repeating the first; along the wall centrelines is fine (its area is reported as drawn). A door or window counts for the room when it sits on this outline" },
      use: { type: "string", description: "living, kitchen, bedroom, bath, hall, …" },
    },
  },
  roofs: {
    type: "object", additionalProperties: false, required: ["storey", "kind", "footprint"],
    description: "A roof whose eaves sit on top of a storey's walls.",
    properties: {
      storey: { type: "string", description: "The storey it covers" },
      kind: { type: "string", enum: ["flat", "shed", "gable", "hip"] },
      footprint: {
        type: "array", items: POINT, minItems: 3,
        description: "The outside face of the walls [x, y]; for shed, gable and hip a rectangle whose first edge is an eave (a gable's ridge runs along it)",
      },
      pitch: { type: "number", minimum: 0, maximum: 80, description: "Degrees, default 30 (flat 0)" },
      overhang: { type: "number", minimum: 0, description: "Past the walls at the eaves (m), default 0.5" },
      gableOverhang: { type: "number", minimum: 0, description: "Past the gable walls (m), default the overhang" },
      thickness: LENGTH("Build-up (m), default 0.3"),
      name: { type: "string" },
    },
  },
  stairs: {
    type: "object", additionalProperties: false, required: ["storey", "at"],
    description: "A stair from a storey's floor up to the next storey's floor, which it cuts its well in (over every tread with less than 2 m headroom). Risers: the storey height in equal risers near `riser`; a flight of n risers is (n − 1) × `going` long. An L or U has its landing after half the risers (rounded up), `landingDepth` long; an L turns 90° towards `turn` after it, a U comes back alongside the first flight, `gap` apart, towards `turn`, and arrives near where the first flight started.",
    properties: {
      storey: { type: "string", description: "The storey it starts on" },
      at: { ...POINT, description: "Centre of the first flight's width at its first riser [x, y]" },
      direction: { ...POINT, description: "Which way the first flight climbs, default [1, 0]" },
      shape: { type: "string", enum: ["straight_run", "two_straight_run", "quarter_turn", "half_turn"], description: "Default straight_run; quarter_turn (L) and half_turn (U) have a landing" },
      turn: { type: "string", enum: ["left", "right"], description: "Which way an L or U turns, seen walking up; default left" },
      width: LENGTH("Flight width (m), default 1.0"),
      riser: LENGTH("Target riser height (m), default 0.18"),
      going: LENGTH("Tread depth (m), default 0.27"),
      landingDepth: LENGTH("Landing depth (m), default the width"),
      gap: { type: "number", minimum: 0, description: "Gap between the flights of a U (m), default 0.1" },
      well: { type: "boolean", description: "Cut the well in the floor above, default true" },
      name: { type: "string" },
    },
  },
};

/**
 * `BUILDING_SCHEMA` for these types: each record's `type` lists the names it may take, and its
 * description says what each one is (wall and slab thicknesses), so whoever writes records can
 * choose without guessing. A space's `use` stays free text; its description lists the known
 * uses and what each needs (a window, no door).
 *
 *   agentDoc(doc, { schema: buildingSchema(types), check: () => house.issues });
 */
export function buildingSchema(types: BuildingTypes = defaultBuildingTypes()): Record<BuildingCollection, RecordSchema> {
  const schema = JSON.parse(JSON.stringify(BUILDING_SCHEMA)) as Record<BuildingCollection, RecordSchema>;
  const list = <T>(entries: Record<string, T>, say: (t: T) => string) => Object.entries(entries).map(([n, t]) => `"${n}": ${say(t)}`).join("; ");
  const typed = (c: BuildingCollection, names: string[], description: string) => {
    schema[c].properties!.type = { type: "string", enum: names, description };
  };
  typed("walls", Object.keys(types.walls), `Wall type, default "exterior" — ${list(types.walls, (t) => `${t.type.name}, ${fmt(t.thickness)} m thick`)}`);
  typed("slabs", Object.keys(types.slabs), `Slab type, default "floor" — ${list(types.slabs, (t) => `${t.type.name}, ${fmt(t.thickness)} m thick`)}`);
  typed("openings", Object.keys(types.openings), `Opening type, default the kind — ${list(types.openings, (t) => `${t.name} (${t.kind})`)}`);
  const uses = Object.entries(spaceTypes(types)).map(([n, t]) => {
    const needs = [t.daylight ? "window" : "", t.door === false ? "no door" : ""].filter(Boolean).join(", ");
    return needs ? `"${n}" (${needs})` : `"${n}"`;
  });
  schema.spaces.properties!.use = {
    type: "string",
    description: "What the room is for, any text. A room needs a door on its outline when its storey has other rooms, and a window when its use wants daylight."
      + (uses.length ? ` Known uses: ${uses.join(", ")}` : ""),
  };
  return schema;
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** A wall type a record can name, with its thickness and the colour it is drawn in. */
export interface BuildingWallType { type: WallType; thickness: number; colour?: string }
/** A slab type a record can name, with its thickness. */
export interface BuildingSlabType { type: SlabType; thickness: number; colour?: string }

/** A room use a space record names (`SpaceRecord.use`): the colour it is drawn in and what the room needs. */
export interface BuildingSpaceType {
  /** The colour `bindBuilding` draws the room's floor in. */
  colour?: string;
  /** The room wants daylight: a window on its outline (else `space-no-window`). Default false. */
  daylight?: boolean;
  /**
   * The room needs a door on its outline when its storey has other rooms (else `space-no-door`).
   * False for a room you walk into without one, e.g. an open-plan office cell. Default true.
   */
  door?: boolean;
}

/** The types building records name: wall, slab and opening types by name, and room uses. */
export interface BuildingTypes {
  walls: Record<string, BuildingWallType>;
  slabs: Record<string, BuildingSlabType>;
  openings: Record<string, OpeningType>;
  /**
   * Room uses by the lower-cased `SpaceRecord.use`; a use not listed is drawn in a neutral
   * colour, needs a door and no window. Default `defaultBuildingTypes().spaces`; to add uses,
   * spread those: `{ ...defaultBuildingTypes().spaces, canteen: { colour: "#e8a07a", daylight: true } }`.
   */
  spaces?: Record<string, BuildingSpaceType>;
}

/**
 * Timber construction for a house: "exterior" (Holzrahmenbau, insulated, ~0.25 m),
 * "interior" (a framed partition, 0.125 m) and "solid" (0.2 m) walls; "floor" (joisted,
 * 0.26 m), "ground" (concrete, 0.25 m) and "roof" (joisted flat roof, 0.3 m) slabs; a
 * "door" and a "window"; and the rooms of a house, each with its colour, the ones people
 * stay in (living, kitchen, dining, bedroom, office, study) wanting daylight.
 */
export function defaultBuildingTypes(): BuildingTypes {
  const exteriorLayers = holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: 0.140 } });
  const exterior = new WallType({
    name: "Exterior wall, timber frame",
    construction: HolzrahmenBau({ studProfile: { w: 0.06, h: 0.14, name: "KVH 60×140" }, plateProfile: { w: 0.06, h: 0.14, name: "KVH 60×140" } }),
    layers: exteriorLayers, junctionStyle: HolzrahmenBauJointStyle,
    properties: { isExternal: true, loadBearing: true, uValue: 0.18, fireRating: "REI60" },
  });
  const interior = new WallType({
    name: "Partition, timber frame",
    construction: HolzrahmenBau({ studProfile: { w: 0.06, h: 0.1, name: "KVH 60×100" }, plateProfile: { w: 0.06, h: 0.1, name: "KVH 60×100" } }),
    layers: [
      { material: "Gipsfaser", thickness: 0.0125, position: "interior" },
      { material: "Mineralwolle", thickness: 0.1, position: "core" },
      { material: "Gipsfaser", thickness: 0.0125, position: "exterior" },
    ],
    junctionStyle: HolzrahmenBauJointStyle,
    properties: { isExternal: false, loadBearing: false },
  });
  const solid = new WallType({
    name: "Solid wall", construction: SolidConstruction,
    layers: [{ material: "Concrete", thickness: 0.2, position: "core" }],
    properties: { loadBearing: true },
  });
  const floor = new SlabType({
    name: "Timber joist floor", construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.08, h: 0.22, name: "KVH 80×220" } }),
    layers: [
      { material: "Gipsfaser 12.5 mm", thickness: 0.0125, position: "interior" },
      { material: "OSB 22 mm", thickness: 0.022, position: "exterior" },
    ],
    properties: { loadBearing: true, fireRating: "REI60" },
  });
  const ground = new SlabType({
    name: "Ground slab, concrete", construction: SolidSlabConstruction,
    layers: [{ material: "Concrete", thickness: 0.25, position: "core" }],
    properties: { loadBearing: true },
  });
  const roof = new SlabType({
    name: "Flat roof, timber joists", construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.08, h: 0.24, name: "KVH 80×240" } }),
    properties: { loadBearing: true, isExternal: true },
  });
  return {
    walls: {
      exterior: { type: exterior, thickness: exterior.layeredThickness, colour: "#e8e2d4" },
      interior: { type: interior, thickness: interior.layeredThickness, colour: "#f3f0e8" },
      solid: { type: solid, thickness: 0.2, colour: "#d4d4d0" },
    },
    slabs: {
      floor: { type: floor, thickness: 0.26, colour: "#d8d0bf" },
      ground: { type: ground, thickness: 0.25, colour: "#c9c9c4" },
      roof: { type: roof, thickness: 0.3, colour: "#b9b3a8" },
    },
    openings: {
      door: new OpeningType({ name: "Door", kind: "door", operation: "single_swing_left" }),
      window: new OpeningType({ name: "Window", kind: "window", partitioning: "single_panel" }),
    },
    spaces: defaultSpaceTypes(),
  };
}

/** The rooms of a house: rooms people stay in want daylight. */
function defaultSpaceTypes(): Record<string, BuildingSpaceType> {
  return {
    living: { colour: "#f2c46d", daylight: true }, kitchen: { colour: "#f29e6d", daylight: true }, dining: { colour: "#f2b36d", daylight: true },
    bedroom: { colour: "#8fb8e8", daylight: true }, bath: { colour: "#7fd0d0" }, wc: { colour: "#7fd0d0" },
    hall: { colour: "#c8c8c8" }, corridor: { colour: "#c8c8c8" }, office: { colour: "#a7d39a", daylight: true }, study: { colour: "#a7d39a", daylight: true },
    storage: { colour: "#bdb2a6" }, utility: { colour: "#bdb2a6" },
  };
}

/** The room uses of these types (the defaults when they name none). */
function spaceTypes(types: BuildingTypes): Record<string, BuildingSpaceType> {
  return types.spaces ?? defaultSpaceTypes();
}

// ── Issues ────────────────────────────────────────────────────────────────────

/**
 * Something wrong with a building, on the records it concerns. An `"error"` keeps a record
 * from being built (or builds it wrongly); a `"warning"` builds but is likely a mistake.
 */
export interface BuildingIssue {
  severity: "error" | "warning";
  /** Stable kind: "schema", "unknown-storey", "opening-outside-wall", "wall-end-free", … */
  code: string;
  /** Says what is wrong with the values it found, so whoever wrote them can fix them. */
  message: string;
  /** The records concerned, as `"collection/id"` (what `Doc`, `Selection` and Markup call them). */
  keys: string[];
}

const keyOf = (collection: string, id: string) => `${collection}/${id}`;
const fmt = (v: number) => (Math.round(v * 100) / 100).toString();

/**
 * Check building records before they are built: each record against `BUILDING_SCHEMA`, every
 * reference (`storey`, `wall`) to a record that exists, every type name to the `types`, and
 * the geometry a schema cannot say (a path with a zero-length segment, an empty outline).
 */
export function validateBuilding(data: BuildingData, types: BuildingTypes = defaultBuildingTypes()): BuildingIssue[] {
  const out: BuildingIssue[] = [];
  const err = (code: string, message: string, ...keys: string[]) => out.push({ severity: "error", code, message, keys });
  for (const name of Object.keys(data)) {
    if (!BUILDING_COLLECTIONS.includes(name as BuildingCollection)) {
      out.push({ severity: "warning", code: "unknown-collection", message: `"${name}" is not a building collection (known: ${BUILDING_COLLECTIONS.join(", ")}); it is ignored.`, keys: [] });
    }
  }
  const storeys = data.storeys ?? {}, walls = data.walls ?? {};
  const known = (kind: string, names: Record<string, unknown>, name: string, key: string) => {
    if (!(name in names)) err("unknown-type", `${key}: ${kind} type "${name}" is not defined (defined: ${Object.keys(names).join(", ")}).`, key);
  };
  for (const c of BUILDING_COLLECTIONS) {
    for (const [id, rec] of Object.entries(data[c] ?? {})) {
      const key = keyOf(c, id);
      const schemaIssues = checkRecord(rec, BUILDING_SCHEMA[c]);
      for (const s of schemaIssues) err("schema", `${key}.${s.path}: ${s.message}`, key);
      if (schemaIssues.length) continue;
      const r = rec as unknown as Record<string, unknown>;
      if ("storey" in r && !(String(r.storey) in storeys)) {
        err("unknown-storey", `${key}: storey "${r.storey}" does not exist (storeys: ${Object.keys(storeys).join(", ") || "none"}).`, key);
      }
      if (c === "walls") {
        const w = rec as WallRecord;
        if (w.type !== undefined) known("wall", types.walls, w.type, key);
        for (let i = 1; i < w.path.length; i++) {
          if (Math.hypot(w.path[i][0] - w.path[i - 1][0], w.path[i][1] - w.path[i - 1][1]) < 1e-6) {
            err("zero-length", `${key}: path points ${i - 1} and ${i} are the same point (${w.path[i].join(", ")}).`, key);
          }
        }
      } else if (c === "openings") {
        const o = rec as OpeningRecord;
        if (!(o.wall in walls)) err("unknown-wall", `${key}: wall "${o.wall}" does not exist.`, key);
        if (o.type !== undefined) known("opening", types.openings, o.type, key);
      } else if (c === "stairs") {
        const d = (rec as StairRecord).direction;
        if (d && Math.hypot(d[0], d[1]) < 1e-9) err("zero-length", `${key}: direction [${d.join(", ")}] has no length.`, key);
      } else if (c === "slabs" || c === "spaces" || c === "roofs") {
        const b = c === "roofs" ? (rec as RoofRecord).footprint : (rec as SlabRecord | SpaceRecord).boundary;
        if (Polygon2D.area(b.map(([x, y]) => new Vec2(x, y))) < 1e-6) err("empty-outline", `${key}: the boundary encloses no area.`, key);
        if (c === "slabs" && (rec as SlabRecord).type !== undefined) known("slab", types.slabs, (rec as SlabRecord).type!, key);
      }
    }
  }
  return out;
}

// ── The building ──────────────────────────────────────────────────────────────

/** One storey, built: its walls as one `WallSystem` (they meet at their joints), slabs and spaces. */
export interface RealizedStorey {
  id: string;
  record: StoreyRecord;
  /** Wall id → wall, its openings attached. */
  walls: Map<string, Wall>;
  /** The storey's walls together, so their joints trim. */
  system: WallSystem;
  /** Opening id → the opening in its wall. */
  openings: Map<string, WallOpening>;
  /** Slab id → slab: the storey's floor, and a flat roof over it. */
  slabs: Map<string, Slab>;
  /** Space id → space. */
  spaces: Map<string, Space>;
  /** Roof id → the roof on this storey's walls. */
  roofs: Map<string, Roof>;
  /** Stair id → the stair up from this storey. */
  stairs: Map<string, Stair>;
}

/** The building made from its records: elements by record id, and what could not be built. */
export class Building {
  /** Storeys from the lowest up. */
  readonly storeys: RealizedStorey[] = [];
  /** What validation found and what could not be built (those records are left out). */
  readonly issues: BuildingIssue[];
  private framing = new Map<string, RealizedWall[]>();

  constructor(readonly data: BuildingData, readonly types: BuildingTypes = defaultBuildingTypes()) {
    this.issues = validateBuilding(data, types);
    const bad = new Set(this.issues.filter((i) => i.severity === "error").flatMap((i) => i.keys));
    const storeyIds = Object.entries(data.storeys ?? {}).filter(([id]) => !bad.has(keyOf("storeys", id)))
      .sort((a, b) => a[1].elevation - b[1].elevation);
    const byId = new Map<string, RealizedStorey>();
    for (const [id, record] of storeyIds) {
      const s: RealizedStorey = { id, record, walls: new Map(), system: new WallSystem(), openings: new Map(), slabs: new Map(), spaces: new Map(), roofs: new Map(), stairs: new Map() };
      this.storeys.push(s);
      byId.set(id, s);
    }
    const build = <T>(key: string, fn: () => T): T | undefined => {
      if (bad.has(key)) return undefined;
      try { return fn(); }
      catch (e) {
        this.issues.push({ severity: "error", code: "build-failed", message: `${key}: ${e instanceof Error ? e.message : String(e)}`, keys: [key] });
        return undefined;
      }
    };

    // Slabs first: a wall's default height runs up to the underside of the slab above.
    for (const [id, r] of Object.entries(data.slabs ?? {})) {
      const s = byId.get(r.storey);
      const t = this.slabType(r);
      const slab = s && build(keyOf("slabs", id), () => {
        const boundary = Polygon2D.closeRing(r.boundary.map(([x, y]) => new Vec2(x, y)));
        const top = (r.level ?? "floor") === "top" ? s.record.elevation + s.record.height : s.record.elevation;
        // SlabOpening sizes run along the joists: turn world X / Y sizes into joist-local ones.
        const along = joistDirectionFromBounds(boundary);
        const alongX = Math.abs(along.x) >= Math.abs(along.y);
        const openings = (r.openings ?? []).map((o, i) => new SlabOpening(o.x, o.y, alongX ? o.width : o.depth, alongX ? o.depth : o.width, o.name ?? `opening ${i + 1}`));
        const made = new Slab({ boundary, thickness: r.thickness ?? t.thickness, elevation: top, name: r.name ?? id, type: t.type, openings, joistDirection: along });
        made.openingRings();                                  // throws for an opening outside the slab
        return made;
      });
      if (s && slab) s.slabs.set(id, slab);
    }
    for (const [id, r] of Object.entries(data.walls ?? {})) {
      const s = byId.get(r.storey);
      const t = this.types.walls[r.type ?? "exterior"];
      const wall = s && t && build(keyOf("walls", id), () => new Wall({
        centerline: r.path.map(([x, y]) => new Vec2(x, y)),
        thickness: r.thickness ?? t.thickness,
        height: r.height ?? this.wallHeight(s),
        baseElevation: s.record.elevation,
        name: r.name ?? id,
        type: t.type,
      }));
      if (s && wall) s.walls.set(id, wall);
    }
    const wallsById = new Map<string, { storey: RealizedStorey; wall: Wall }>();
    for (const s of this.storeys) for (const [id, wall] of s.walls) wallsById.set(id, { storey: s, wall });
    for (const [id, r] of Object.entries(data.openings ?? {})) {
      const host = wallsById.get(r.wall);
      if (!host) continue;
      const opening = build(keyOf("openings", id), () => {
        const door = r.kind === "door";
        const o = new WallOpening(r.at, r.width, r.sill ?? (door ? 0 : 0.9), r.head ?? (door ? 2.1 : 2.2), r.name ?? id);
        o.type = this.types.openings[r.type ?? r.kind];
        return o;
      });
      if (opening) { host.wall.openings.push(opening); host.storey.openings.set(id, opening); }
    }
    for (const s of this.storeys) for (const wall of s.walls.values()) s.system.add(wall);
    for (const [id, r] of Object.entries(data.spaces ?? {})) {
      const s = byId.get(r.storey);
      const space = s && build(keyOf("spaces", id), () => new Space({
        name: r.name, boundary: r.boundary.map(([x, y]) => new Vec2(x, y)),
        elevation: s.record.elevation, height: this.wallHeight(s), function: r.use,
      }));
      if (s && space) s.spaces.set(id, space);
    }
    for (const [id, r] of Object.entries(data.roofs ?? {})) {
      const s = byId.get(r.storey);
      const roof = s && build(keyOf("roofs", id), () => new Roof({
        kind: r.kind, footprint: r.footprint.map(([x, y]) => ({ x, y })),
        pitch: r.pitch ?? (r.kind === "flat" ? 0 : 30), eavesElevation: s.record.elevation + this.wallHeight(s),
        overhang: r.overhang, gableOverhang: r.gableOverhang, thickness: r.thickness, name: r.name ?? id,
      }));
      if (s && roof) s.roofs.set(id, roof);
    }
    for (const [id, r] of Object.entries(data.stairs ?? {})) {
      const s = byId.get(r.storey);
      const key = keyOf("stairs", id);
      const stair = s && build(key, () => {
        const shape = r.shape ?? "straight_run";
        const made = new Stair({
          name: r.name ?? id, start: new Vec3(r.at[0], r.at[1], s.record.elevation),
          direction: r.direction ? new Vec2(r.direction[0], r.direction[1]) : new Vec2(1, 0),
          width: r.width, totalRise: s.record.height, riserHeight: r.riser, treadDepth: r.going,
          shape, turn: r.turn, landingDepth: r.landingDepth, gap: r.gap,
          type: new StairType({ name: shape.replace(/_/g, " "), shape }),
        });
        made.flights();                                     // throws for a stair that cannot be built
        return made;
      });
      if (!s || !stair) continue;
      s.stairs.set(id, stair);
      // Its well, in the floor it arrives at.
      if (r.well === false) continue;
      const above = this.storeys.find((o) => Math.abs(o.record.elevation - (s.record.elevation + s.record.height)) < 1e-3);
      for (const [sid, slab] of above?.slabs ?? []) {
        if ((data.slabs?.[sid]?.level ?? "floor") !== "floor") continue;
        try {
          const well = stair.slabOpening(slab);
          if (!well) continue;
          slab.openings.push(well);
          slab.openingRings();                              // throws if the well leaves the slab
        } catch (e) {
          slab.openings.pop();
          this.issues.push({ severity: "error", code: "stair-well", message: `${key}: its well does not fit slabs/${sid}: ${e instanceof Error ? e.message : String(e)}`, keys: [key, keyOf("slabs", sid)] });
        }
      }
    }
  }

  /** The storey a record is on, by the storey's id. */
  storey(id: string): RealizedStorey | undefined { return this.storeys.find((s) => s.id === id); }

  /** The levels, for `renderer.setSectionLevels(building.levels())`. */
  levels(): { name: string; elevation: number }[] {
    return this.storeys.map((s) => ({ name: s.record.name, elevation: s.record.elevation }));
  }

  /** A storey's walls with their framing, trimmed at the joints (`WallSystem.realize()`), built once. */
  realizedWalls(storeyId: string): RealizedWall[] {
    let r = this.framing.get(storeyId);
    if (!r) {
      const s = this.storey(storeyId);
      r = s && s.system.walls.length ? s.system.realize() : [];
      this.framing.set(storeyId, r);
    }
    return r;
  }

  /**
   * How tall a storey's walls are unless a wall says otherwise: up to the underside of the
   * floor above (the next storey's floor slab, or this storey's flat roof), else the storey's height.
   */
  wallHeight(s: RealizedStorey): number {
    const top = s.record.elevation + s.record.height;
    let t = 0;
    for (const r of Object.values(this.data.slabs ?? {})) {
      const on = this.data.storeys?.[r.storey];
      if (!on) continue;
      const slabTop = (r.level ?? "floor") === "top" ? on.elevation + on.height : on.elevation;
      if (Math.abs(slabTop - top) < 1e-3) t = Math.max(t, r.thickness ?? this.slabType(r).thickness);
    }
    return s.record.height - t;
  }

  /** How thick a roof's gable walls are: as the storey's thickest wall (its outside walls). */
  gableThickness(s: RealizedStorey): number {
    return Math.max(0.2, ...[...s.walls.values()].map((w) => w.thickness));
  }

  private slabType(r: SlabRecord): BuildingSlabType {
    return this.types.slabs[r.type ?? "floor"] ?? Object.values(this.types.slabs)[0];
  }

  /**
   * What is wrong with the building, by record: the `issues` (validation, records that could
   * not be built) and the checks — openings that leave their wall, overlap or reach above it;
   * wall ends that meet no other wall; storeys that do not stack; a storey without a floor;
   * rooms that are tiny or overlap, have no door (unless their space type needs none), or no
   * window where their space type wants daylight (by default living, kitchen, dining, bedroom,
   * office, study); uncomfortable stairs and wells that leave the floor. An empty list: nothing found.
   */
  check(): BuildingIssue[] {
    const out = [...this.issues];
    const uses = spaceTypes(this.types);
    const warn = (code: string, message: string, ...keys: string[]) => out.push({ severity: "warning", code, message, keys });
    const error = (code: string, message: string, ...keys: string[]) => out.push({ severity: "error", code, message, keys });

    // Storeys stack: each starts where the one below ends.
    for (let i = 1; i < this.storeys.length; i++) {
      const a = this.storeys[i - 1], b = this.storeys[i];
      const end = a.record.elevation + a.record.height;
      if (Math.abs(end - b.record.elevation) > 0.01) {
        warn("storey-gap", `Storey "${a.record.name}" ends at ${fmt(end)} m but "${b.record.name}" starts at ${fmt(b.record.elevation)} m.`, keyOf("storeys", a.id), keyOf("storeys", b.id));
      }
      if (!b.slabs.size || [...b.slabs.keys()].every((id) => this.data.slabs?.[id]?.level === "top")) {
        warn("storey-without-floor", `Storey "${b.record.name}" has no floor slab.`, keyOf("storeys", b.id));
      }
    }

    for (const s of this.storeys) {
      // Openings: inside their wall, apart, below its top.
      const wallIds = new Map<Wall, string>([...s.walls].map(([id, w]) => [w, id]));
      const openingIds = new Map<WallOpening, string>([...s.openings].map(([id, o]) => [o, id]));
      for (const [wall, wid] of wallIds) {
        const len = wall.length;
        const list = [...wall.openings].sort((a, b) => a.centerlinePosition - b.centerlinePosition);
        list.forEach((o, i) => {
          const key = keyOf("openings", openingIds.get(o) ?? "?");
          const from = o.centerlinePosition - o.width / 2, to = o.centerlinePosition + o.width / 2;
          if (from < -1e-6 || to > len + 1e-6) {
            error("opening-outside-wall", `${key} spans ${fmt(from)}–${fmt(to)} m along walls/${wid}, which is ${fmt(len)} m long.`, key, keyOf("walls", wid));
          }
          if (o.headHeight > wall.height + 1e-6) {
            error("opening-above-wall", `${key} reaches ${fmt(o.headHeight)} m, above walls/${wid} (${fmt(wall.height)} m high).`, key, keyOf("walls", wid));
          }
          if (o.sillHeight >= o.headHeight) error("opening-height", `${key}: sill ${fmt(o.sillHeight)} m is not below head ${fmt(o.headHeight)} m.`, key);
          const next = list[i + 1];
          if (next && next.centerlinePosition - next.width / 2 < to - 1e-6) {
            const nkey = keyOf("openings", openingIds.get(next) ?? "?");
            error("openings-overlap", `${key} and ${nkey} overlap along walls/${wid}.`, key, nkey);
          }
          // Across a corner of a polyline wall: the opening would bend round it.
          let run = 0;
          const cl = wall.centerline;
          for (let k = 1; k < cl.length - 1; k++) {
            run += cl[k].distTo(cl[k - 1]);
            if (run > from + 1e-6 && run < to - 1e-6) warn("opening-at-corner", `${key} crosses the corner of walls/${wid} at ${fmt(run)} m.`, key);
          }
        });
      }

      // Wall ends meet another wall (an open end is a free-standing wall, usually a mistake).
      const walls = [...s.walls];
      for (const [id, wall] of walls) {
        if (wall.isClosedPolyline) continue;
        const cl = wall.centerline;
        for (const end of [cl[0], cl[cl.length - 1]]) {
          const met = walls.some(([oid, other]) => oid !== id && distanceToPolyline(end, other.centerline) <= (other.thickness + wall.thickness) / 2 + 0.05);
          if (!met) warn("wall-end-free", `walls/${id}: its end at (${fmt(end.x)}, ${fmt(end.y)}) meets no other wall.`, keyOf("walls", id));
        }
      }

      // Stairs: a comfortable step (2 risers + 1 going ≈ 0.63 m).
      for (const [id, st] of s.stairs) {
        const r = st.actualRiser, g = st.treadDepth, step = 2 * r + g;
        if (r > 0.2 || step < 0.59 || step > 0.65) {
          warn("stair-step", `stairs/${id}: risers of ${fmt(r * 1000) } mm and goings of ${fmt(g * 1000)} mm make a step of ${fmt(step * 1000)} mm (comfortable: 590–650 mm, risers up to 200 mm).`, keyOf("stairs", id));
        }
      }

      // Rooms: not tiny, not on top of each other.
      const spaces = [...s.spaces];
      for (const [id, sp] of spaces) {
        if (sp.area() < 2) warn("space-small", `spaces/${id} "${sp.name}" is ${fmt(sp.area())} m².`, keyOf("spaces", id));
      }
      // A way in, and daylight where people stay: a door, and a window where its use wants daylight, on its outline.
      const onOutline = (sp: Space, kind: "door" | "window") => [...s.walls.values()].some((wall) => wall.openings.some((o) => {
        if ((o.type ? o.type.kind === "door" : o.isDoor) !== (kind === "door")) return false;
        return distanceToPolyline(pointOnWall(wall, o.centerlinePosition), Polygon2D.closeRing(sp.boundary)) <= wall.thickness / 2 + 0.05;
      }));
      for (const [id, sp] of spaces) {
        const type = uses[(sp.function ?? "").toLowerCase()];
        if (spaces.length > 1 && (type?.door ?? true) && !onOutline(sp, "door")) {
          warn("space-no-door", `spaces/${id} "${sp.name}" has no door on its outline: no way in.`, keyOf("spaces", id));
        }
        if (type?.daylight && !onOutline(sp, "window")) {
          warn("space-no-window", `spaces/${id} "${sp.name}" (${sp.function}) has no window on its outline.`, keyOf("spaces", id));
        }
      }
      for (let i = 0; i < spaces.length; i++) {
        for (let j = i + 1; j < spaces.length; j++) {
          const a = PolygonBool.fromRing(Polygon2D.openRing(spaces[i][1].boundary));
          const b = PolygonBool.fromRing(Polygon2D.openRing(spaces[j][1].boundary));
          const shared = PolygonBool.area(PolygonBool.intersection(a, b));
          if (shared > 0.05) {
            warn("spaces-overlap", `spaces/${spaces[i][0]} and spaces/${spaces[j][0]} overlap by ${fmt(shared)} m².`, keyOf("spaces", spaces[i][0]), keyOf("spaces", spaces[j][0]));
          }
        }
      }
    }
    return out;
  }

  /** Floor area of the spaces, in m², per storey id and in total. */
  areas(): { total: number; byStorey: Record<string, number> } {
    const byStorey: Record<string, number> = {};
    let total = 0;
    for (const s of this.storeys) {
      const a = [...s.spaces.values()].reduce((sum, sp) => sum + sp.area(), 0);
      byStorey[s.id] = a;
      total += a;
    }
    return { total, byStorey };
  }

  /**
   * The building as an IFC file: a storey each, with its walls (framing, openings, joints),
   * slabs (joists) and spaces (bounded by their walls). `members: false` leaves the framing
   * out for a lighter file.
   */
  toIfc(opts: { projectName?: string; members?: boolean } = {}): string {
    const members = opts.members ?? true;
    const [first, ...rest] = this.storeys;
    const ifc = new IfcWriter({ projectName: opts.projectName ?? "Building", storeyName: first?.record.name, storeyElevation: first?.record.elevation });
    const refs = new Map<string, number | undefined>();
    if (first) refs.set(first.id, undefined);                 // the writer's first storey
    for (const s of rest) refs.set(s.id, ifc.addStorey({ name: s.record.name, elevation: s.record.elevation }));
    for (const s of this.storeys) {
      const storey = refs.get(s.id);
      if (s.system.walls.length) ifc.addWallSystem(s.system, { storey, includeMembers: members });
      for (const [id, slab] of s.slabs) {
        const top = this.data.slabs?.[id]?.level === "top";
        ifc.addSlab(slab, { storey, includeParts: members, predefinedType: top ? "ROOF" : s === first && !top ? "BASESLAB" : "FLOOR" });
      }
      const walls = [...s.walls.values()];
      for (const sp of s.spaces.values()) ifc.addSpace(sp, { storey, boundaries: boundingWalls(sp, walls) });
      for (const st of s.stairs.values()) ifc.addStair(st, { storey });
      for (const roof of s.roofs.values()) ifc.addRoof(roof, { storey, gableThickness: this.gableThickness(s) });
    }
    return ifc.save();
  }
}

/** The point at arc length `m` along a wall's centreline. */
function pointOnWall(wall: Wall, m: number): Vec2 {
  const cl = wall.centerline;
  let run = 0;
  for (let i = 1; i < cl.length; i++) {
    const len = cl[i].distTo(cl[i - 1]);
    if (m <= run + len || i === cl.length - 1) return cl[i - 1].lerp(cl[i], len > 1e-12 ? Math.max(0, Math.min(1, (m - run) / len)) : 0);
    run += len;
  }
  return cl[0];
}

/** Distance from a point to a polyline. */
function distanceToPolyline(p: Vec2, line: readonly Vec2[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], ab = line[i].sub(a);
    const t = Math.max(0, Math.min(1, p.sub(a).dot(ab) / Math.max(ab.dot(ab), 1e-12)));
    best = Math.min(best, p.distTo(a.add(ab.mul(t))));
  }
  return best;
}

/**
 * Build the BIM elements of a building from its records. Records with errors are left out and
 * reported in `building.issues`; `building.check()` adds what the built geometry shows.
 */
export function realizeBuilding(data: BuildingData, types: BuildingTypes = defaultBuildingTypes()): Building {
  return new Building(data, types);
}

// ── Document → scene ──────────────────────────────────────────────────────────

/** How `bindBuilding` draws: the walls' envelope (default), or their framing members. */
export type BuildingDetail = "envelope" | "framing";

/** Options for `bindBuilding`: the types records name, and how much to draw. */
export interface BindBuildingOptions {
  types?: BuildingTypes;
  detail?: BuildingDetail;
}

/** What `bindBuilding` returns: the building as last built, its issues, and the record ↔ object map. */
export interface BuildingBinding {
  /** The building as last built from the document. */
  readonly building: Building;
  /** `building.check()` as of the last build. */
  readonly issues: BuildingIssue[];
  /** The record a scene object draws (`"walls/w3"`), or undefined. */
  recordOf(sceneId: string): string | undefined;
  /** The scene ids that draw a record. */
  objectsOf(key: string): string[];
  /** Draw the envelope or the framing. */
  setDetail(detail: BuildingDetail): void;
  /** Called after each build (and once now) with the building and its issues. */
  onBuild(cb: (building: Building, issues: BuildingIssue[]) => void): () => void;
  /** Build and draw again. */
  refresh(): void;
  dispose(): void;
}

/**
 * Keep a scene in step with the building records of a document. Every change to a building
 * collection rebuilds the building (a storey's walls trim at their joints, so one wall's edit
 * can move its neighbours' corners) and redraws it, each object keyed by its record
 * (`"walls/w3"`, `"openings/o1"`), so selection, Markup and callouts name records. Changes in
 * one turn of the event loop build once.
 *
 *   const doc = new Doc<BuildingRecords>({ name: "house" });
 *   const house = bindBuilding(doc, app.scene);
 *   house.onBuild((b, issues) => app.status(`${issues.length} issues`));
 */
export function bindBuilding(doc: Doc<any>, scene: Scene, opts: BindBuildingOptions = {}): BuildingBinding {
  const types = opts.types ?? defaultBuildingTypes();
  const uses = spaceTypes(types);
  let detail: BuildingDetail = opts.detail ?? "envelope";
  let building = new Building({}, types);
  let issues: BuildingIssue[] = [];
  const objects = new Map<string, string[]>();               // record key → scene ids
  const listeners = new Set<(b: Building, issues: BuildingIssue[]) => void>();
  let scheduled = false;

  const add = (key: string, mesh: Mesh, style: Parameters<Scene["addMesh"]>[1]) => {
    const obj = scene.withKey(key, () => scene.addMesh(mesh, style));
    const list = objects.get(key) ?? [];
    list.push(obj.id);
    objects.set(key, list);
  };

  const data = (): BuildingData => {
    const out: BuildingData = {};
    for (const c of BUILDING_COLLECTIONS) {
      const rows = doc.all(c) as [string, never][];
      if (rows.length) (out as Record<string, unknown>)[c] = Object.fromEntries(rows);
    }
    return out;
  };

  const draw = () => {
    for (const ids of objects.values()) for (const id of ids) scene.remove(id);
    objects.clear();
    building = new Building(data(), types);
    for (const s of building.storeys) {
      const wallIds = new Map<Wall, string>([...s.walls].map(([id, w]) => [w, id]));
      for (const r of building.realizedWalls(s.id)) {
        const id = wallIds.get(r.wall);
        if (!id) continue;
        const rec = building.data.walls?.[id];
        const colour = types.walls[rec?.type ?? "exterior"]?.colour ?? "#e8e2d4";
        if (detail === "framing" && r.parts.length) {
          for (const p of r.parts) add(keyOf("walls", id), p.mesh, { color: "#d6b07a", layer: "framing", label: undefined });
        } else {
          add(keyOf("walls", id), r.envelopeMesh, { color: colour, layer: "walls" });
        }
      }
      for (const [id, o] of s.openings) {
        const wall = [...s.walls.values()].find((w) => w.openings.includes(o));
        if (!wall) continue;
        for (const part of openingFill(wall, o)) {
          add(keyOf("openings", id), part.mesh, part.role === "glazing"
            ? { color: "#9cc8e8", opacity: 0.45, layer: "openings" }
            : { color: part.role === "leaf" ? "#9b7653" : "#7d5f45", layer: "openings" });
        }
      }
      for (const [id, roof] of s.roofs) {
        for (const plane of roof.planes()) add(keyOf("roofs", id), plane.mesh, { color: "#a8705a", layer: "roofs" });
        const wallColour = types.walls.exterior?.colour ?? "#e8e2d4";
        for (const g of roof.gables(building.gableThickness(s))) add(keyOf("roofs", id), g.mesh, { color: wallColour, layer: "walls" });
      }
      for (const [id, st] of s.stairs) {
        for (const f of st.flights()) add(keyOf("stairs", id), new Mesh(f.positions, f.indices), { color: "#c9a27a", flatShading: true, layer: "stairs" });
        const landing = st.landing();
        if (landing) add(keyOf("stairs", id), landing.toMesh(), { color: "#c9a27a", layer: "stairs" });
      }
      for (const [id, slab] of s.slabs) {
        const rec = building.data.slabs?.[id];
        const colour = types.slabs[rec?.type ?? "floor"]?.colour ?? "#d8d0bf";
        if (detail === "framing" && slab.type?.construction) {
          for (const p of realizeSlab(slab).parts) add(keyOf("slabs", id), p.mesh, { color: "#d6b07a", layer: "framing" });
        } else {
          add(keyOf("slabs", id), slab.toMesh(), { color: colour, layer: "slabs" });
        }
      }
      for (const [id, sp] of s.spaces) {
        const floor = new Slab({ boundary: Polygon2D.closeRing(sp.boundary), thickness: 0.01, elevation: sp.elevation + 0.02 }).toMesh();
        const use = (sp.function ?? "").toLowerCase();
        add(keyOf("spaces", id), floor, {
          color: uses[use]?.colour ?? "#d9cbe8", opacity: 0.5, layer: "spaces",
          label: `${sp.name} · ${fmt(sp.area())} m²`,
        });
      }
    }
    issues = building.check();
    for (const cb of listeners) cb(building, issues);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; draw(); });
  };
  const off = doc.onChange((changes) => {
    if (changes.some((c) => BUILDING_COLLECTIONS.includes(c.collection as BuildingCollection))) schedule();
  });
  draw();

  return {
    get building() { return building; },
    get issues() { return issues; },
    recordOf: (sceneId) => {
      for (const [key, ids] of objects) if (ids.includes(sceneId)) return key;
      return undefined;
    },
    objectsOf: (key) => [...(objects.get(key) ?? [])],
    setDetail: (d) => { if (d !== detail) { detail = d; draw(); } },
    onBuild: (cb) => { listeners.add(cb); cb(building, issues); return () => listeners.delete(cb); },
    refresh: draw,
    dispose: () => {
      off();
      for (const ids of objects.values()) for (const id of ids) scene.remove(id);
      objects.clear();
      listeners.clear();
    },
  };
}
