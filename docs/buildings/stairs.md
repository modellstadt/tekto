# Stairs

<Live page="framed-floor" label="Framed Floor" poster="/shots/floor-stair-well.webp" alt="A half-turn timber stair under a joisted floor, with its well framed" />

<Live page="sketch-drawing" label="Sketch + drawing" />

`Stair` is a stair from plain numbers: where it starts, which way it runs, the height it climbs, its width, and a shape: one straight flight, two flights in line, a quarter turn (L) or a half turn (U), the last three with a landing. The riser is the total rise divided evenly. Its `structure` says how it is built: `"concrete"` steps on a 160 mm waist slab, `"timber"` treads between two stringers with open risers, a `"steel"` plate folded into treads and risers on flat stringers, or `"solid"` blocks down to the floor (the default, a massing). `footprint()` is its outline in plan, and `slabOpening(floor)` is the well the floor above needs, over every tread with less than 2 m of headroom.

```ts
import { IfcWriter, JoistedSlab, Slab, SlabType, Stair, Vec2, Vec3 } from "tekto/core";

const stair = new Stair({
  name: "Stair",
  start: new Vec3(1, 1, 0),             // centre of the first flight at its first riser, floor level
  direction: new Vec2(1, 0),
  totalRise: 3,
  width: 1,
  shape: "half_turn",                    // "straight_run" | "two_straight_run" | "quarter_turn" | "half_turn"
  turn: "left",
  landingDepth: 1.1,
  structure: "timber",                   // "solid" | "concrete" | "timber" | "steel"
});
stair.risers;                            // 17
stair.actualRiser;                       // 3 / 17 m

const floor = new Slab({
  boundary: [new Vec2(0, 0), new Vec2(6, 0), new Vec2(6, 4.5), new Vec2(0, 4.5)],
  thickness: 0.25, elevation: 3, name: "First floor",
  type: new SlabType({ name: "Holzbalkendecke", construction: JoistedSlab({ spacing: 0.625 }) }),
});
const well = stair.slabOpening(floor);   // trimmers and headers frame it when the slab is realized
if (well) floor.openings.push(well);

const ifc = new IfcWriter({ projectName: "Stair" });
ifc.addStair(stair);                      // an IfcStair of its flights and the landing
const upper = ifc.addStorey({ name: "First floor", elevation: 3 });
ifc.addSlab(floor, { storey: upper });
console.log(stair.flights().length, stair.landing()?.area, ifc.save().length);
```

![A timber stair, the floor above cut away: treads between two stringers, open risers](/shots/stair-timber.webp)

`stair.parts()` gives each flight's parts as side profiles (the outline along the flight and its height, and where the part runs across the width), so a section or an elevation is drawn from the same stair as the model: the *Sketch + drawing* page cuts a section A-A through it.

In a [building](/buildings/records), a stair is a record on its storey (`{ storey, at, direction, shape, turn, structure }`); it climbs that storey's height and cuts its well in the floor above by itself.

::: tip Playground
[Framed Floor](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-floor.ts): `?page=framed-floor`, every shape and structure, the well and its framing, IFC export. [Sketch + drawing](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/sketch-drawing.ts): `?page=sketch-drawing`, a plan and a section through the stair.
:::
