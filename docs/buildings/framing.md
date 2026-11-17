# Walls, slabs and framing

<Live page="framed-wall" label="Framed Wall" poster="/shots/timber-frame.webp" alt="A three-storey timber frame from the Timber + IFC page" />

The BIM layer separates a *type* from its *instances*, as IFC does. A `WallType` carries a construction (`HolzrahmenBau`, `BalloonFrame`, solid CLT) and its material layers; a `Wall` is a centreline with a thickness, a height and openings. `realize(wall)` applies the type and returns the parts a carpenter would cut: studs, plates, headers, sills, sheathing. Slabs work the same way: a `SlabType` with `JoistedSlab` frames a `Slab` with joists, rim joists, trimmers and headers around its openings.

```ts
import {
  buildCutList, HolzrahmenBau, holzrahmenbauLayers, JoistedSlab, realize, realizeSlab,
  Slab, SlabType, Vec2, Wall, WallOpening, WallType,
} from "tekto/core";

const layers = holzrahmenbauLayers({ insulation: { material: "Mineralwolle", thickness: 0.16 } });
const exterior = new WallType({
  name: "Holzrahmenbau 160",
  construction: HolzrahmenBau({ studProfile: { w: 0.06, h: 0.16, name: "KVH 60×160" }, studSpacing: 0.625 }),
  layers,
});

const wall = new Wall({
  centerline: [new Vec2(0, 0), new Vec2(5, 0)],
  thickness: layers.reduce((t, l) => t + l.thickness, 0),
  height: 2.7,
  type: exterior,
});
wall.openings.push(WallOpening.window(2.5, 1.4, 0.9, 2.2));   // centre along the wall, width, sill, head
wall.syncOpeningsToRibbon();

const parts = realize(wall).parts;                            // each with role, profile, length, mesh
const cutList = buildCutList(parts);                          // grouped by material × profile × length

const floor = new Slab({
  boundary: [new Vec2(0, 0), new Vec2(6, 0), new Vec2(6, 4.5), new Vec2(0, 4.5)],
  thickness: 0.25, elevation: 3,
  type: new SlabType({ name: "Holzbalkendecke", construction: JoistedSlab({ spacing: 0.625, profile: { w: 0.06, h: 0.22 } }) }),
});
const joists = realizeSlab(floor).parts.filter((p) => p.role === "joist");
console.log(cutList, joists.length);
```

## What to know

- Walls meet at **joints** (`WallJoint`): butt or mitred, with one wall running through the corner. `WallSystem` finds them from the centrelines.
- `openingFill(wall, opening)` builds a window's frame, mullions and glass, or a door's leaves, the way the IFC export writes them.
- `chooseJoistDirection` picks the joist direction from the supporting walls; set `joistDirection` on the slab to choose yourself.
- In a [building](/buildings/records), walls and slabs are records and their types are named; `setDetail("framing")` shows the parts.

![A framed wall with a callout per kind of member](/shots/framed-wall-callouts.webp)

::: tip Playground
[Timber + IFC](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/timber/index.ts) (`?page=timber`), [Framed Wall](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/framed-wall.ts) (`?page=framed-wall`).
:::
