# BIM / Walls

Domain-semantics layer over the geometric wall envelope in [src/core/geometry/walls.ts](../../core/geometry/walls.ts). Implements three patterns borrowed from IFC, stripped of the schema bureaucracy.

> See also the geometry-side [Wall](../../core/geometry/walls.ts), the engine that underlies all wall types: [ExtrudedRibbon](../../core/geometry/ExtrudedRibbon.ts), and the junction-aware [RibbonSystem](../../core/geometry/RibbonSystem.ts).

---

## Three patterns from IFC

### 1. Type-Instance ([WallType](types.ts))

IFC distinguishes `IfcWallType` (the *kind* of wall — "exterior 2×4 framed, R-15") from `IfcWall` (the *instance* — this particular wall over here). One type, many instances. We mirror that:

```ts
import { WallType, Wall, BalloonFrame } from "tekto";

// Define the type once.
const Ext2x4 = new WallType({
  name: "Ext 2×4 framed",
  construction: BalloonFrame({ studSpacing: 0.4 }),
  properties: { loadBearing: true, isExternal: true, fireRating: "1hr" },
});

// Reuse for many walls.
const w1 = new Wall({ centerline: cl1, thickness: 0.14, height: 3, type: Ext2x4 });
const w2 = new Wall({ centerline: cl2, thickness: 0.14, height: 3, type: Ext2x4 });
```

This is exactly how Revit, ArchiCAD, and Tekla work under the hood — a wall type is heavily shared; walls hold references to it.

**Why**: it saves you from re-specifying construction per instance, makes "change all 2×4 walls to 2×6" a single edit, and round-trips cleanly to IFC via `IfcRelDefinesByType`.

### 2. Material Layers + Aggregated Parts ([MaterialLayer](types.ts), [WallPart](types.ts))

A wall type has **two parallel representations**, either or both:

| Representation | When to use | IFC analogue |
|---|---|---|
| `layers: MaterialLayer[]` | Monolithic walls (CMU, concrete, CLT, plaster build-ups). One mesh; layers are metadata for take-off / U-value / IFC. | `IfcMaterialLayerSet` + `IfcMaterialLayerSetUsage` |
| `construction: WallConstruction` | Framed walls (timber stud, steel stud). Each member is a separate mesh. | `IfcRelAggregates` → `IfcMember`s + `IfcCovering`s |

A typical timber-frame wall uses **both** — `construction: BalloonFrame(...)` for the framing parts, and `layers: [...]` for the sheathing + gypsum + cladding.

```ts
// Monolithic — single mesh, layered material:
const CMU = new WallType({
  name: "200 mm CMU + drywall",
  construction: SolidConstruction,
  layers: [
    { material: "Drywall 13 mm", thickness: 0.013, position: "interior" },
    { material: "CMU 190 mm",    thickness: 0.190, position: "core" },
    { material: "Render 10 mm",  thickness: 0.010, position: "exterior" },
  ],
  properties: { fireRating: "2hr", uValue: 1.6, loadBearing: true },
});

// Framed — many sub-meshes, plus layered sheathing/finishes:
const Framed = new WallType({
  name: "2×4 framed + OSB + drywall",
  construction: BalloonFrame({ studSpacing: 0.4 }),
  layers: [
    { material: "OSB 11 mm",     thickness: 0.011, position: "exterior" },
    { material: "Gypsum 13 mm",  thickness: 0.013, position: "interior" },
  ],
  properties: { loadBearing: true, isExternal: true },
});
```

**Why**: keeps both modelling traditions usable. Quantity surveyors live in layers; framers and structural engineers live in members. The same wall type can serve both with one definition.

### 3. Property Sets ([PropertyMap](types.ts))

Every IFC element carries an open-ended `IfcPropertySet`. For walls, `Pset_WallCommon` has `FireRating`, `AcousticRating`, `ThermalTransmittance`, `IsExternal`, `LoadBearing`, etc. We adopt the open shape:

```ts
const wall = new Wall({
  centerline, thickness: 0.14, height: 3,
  type: Ext2x4,
  properties: {
    // Wall-instance overrides (override the type's defaults):
    fireRating: "2hr",
    // Anything custom — passes through to IFC as a user Pset:
    constructionPhase: "Phase 2",
    inspectionDate: "2026-06-05",
  },
});
```

The IFC exporter will:
- Map the standard keys (`fireRating`, `uValue`, `loadBearing`, `isExternal`, …) to `Pset_WallCommon`.
- Bundle unknown keys into a custom Pset named after the wall type.

Walls **and** parts (`WallPart.properties`) **and** layers (`MaterialLayer.properties`) all carry their own Psets.

**Why**: no schema lock-in for the everyday case; predictable IFC mapping for the standard set; zero friction for custom project data.

---

## What we left out

Three things from IFC that **don't** belong in this layer:

- **Relationship-as-object**. IFC turns every relation (`IfcRelAggregates`, `IfcRelAssociatesMaterial`, `IfcRelDefinesByType`, …) into its own STEP entity. That's a serialisation artefact — in TypeScript we just hold references. The IFC exporter unrolls these into the schema at write-time.
- **`IfcWallStandardCase` vs `IfcWall`**. IFC distinguishes "axis + perpendicular extrusion" from "any geometry" for old-viewer performance. Internally we have one [`Wall`](../../core/geometry/walls.ts) — the exporter picks the IFC subtype based on whether the centerline is a single straight segment with no curves.
- **Full material vocabulary**. `IfcMaterial`, `IfcMaterialProfile`, `IfcMaterialProfileSet`, `IfcMaterialProfileSetUsage` — five classes to say "a stud has a 2×4 cross-section." We use `{ material: "SPF", profile: { w: 0.038, h: 0.089 } }` and let the exporter expand.

---

## API at a glance

```ts
// One reusable type.
class WallType {
  constructor(opts: {
    name: string;
    description?: string;
    construction?: WallConstruction;   // (wall) => WallPart[]
    layers?: MaterialLayer[];
    properties?: PropertyMap;
  });
  layeredThickness: number;            // sum of layers (0 if none)
}

// The function form of a construction.
type WallConstruction = (wall: Wall) => WallPart[];

// Apply a wall's type to get its full realisation.
function realize(wall: Wall): RealizedWall;

// Fabrication helper for framed walls.
function buildCutList(parts: WallPart[], roundMm?: number): CutListItem[];
```

## Built-in constructions

- **`SolidConstruction`** ([solid.ts](solid.ts)) — single envelope as one part. Use for concrete / CMU / monolithic CLT.
- **`BalloonFrame(opts)`** ([balloon-frame.ts](balloon-frame.ts)) — sill plate + top plates + studs at `studSpacing`. Headers / cripples are a marked-TODO.
- **`CltConstruction`** + **`cltLayers(opts)`** ([clt.ts](clt.ts)) — single panel + lamellae as `MaterialLayer[]` with alternating grain.

## End-to-end example

```ts
import {
  Wall, WallSystem, WallOpening,
  WallType, BalloonFrame, realize, buildCutList,
} from "tekto";

// 1. Define the type — IFC's IfcWallType.
const Framed2x4 = new WallType({
  name: "2×4 framed w/ OSB",
  construction: BalloonFrame({
    studSpacing: 0.4,
    studProfile: { w: 0.038, h: 0.089, name: "SPF 2×4" },
    topPlateCount: 2,
  }),
  layers: [
    { material: "OSB 11 mm",    thickness: 0.011, position: "exterior" },
    { material: "Gypsum 13 mm", thickness: 0.013, position: "interior" },
  ],
  properties: { loadBearing: true, isExternal: true, fireRating: "1hr" },
});

// 2. Build walls (instances) referencing the type.
const w1 = new Wall({
  centerline: cl1, thickness: 0.14, height: 3,
  type: Framed2x4,
});
w1.openings.push(WallOpening.door(2.0));

// 3. Combine into a system (junction-aware meshing) for the envelope.
const system = new WallSystem([w1, w2, w3]);
const envelope = system.buildMesh();
lab.flatMesh(envelope).color("#cfd8dc");

// 4. Realise individual walls to inspect / render the framing parts.
const r = realize(w1);
for (const p of r.parts) {
  lab.flatMesh(p.mesh).label(p.name).color(colorForRole(p.role));
}
console.log(r.layers, r.properties);

// 5. Cut list for fabrication.
console.table(buildCutList(r.parts));
//  → [{ material: "SPF", profile: …, length: 2.7, count: 18, role: "stud" }, …]
```

## When to use what

| Task | Use |
|---|---|
| Quick visual of a wall (no construction info) | `wall.toMesh()` (envelope, no type needed) |
| Architectural drawings, hidden-line elevations | `wall.toMesh()` + `extractVisiblePolylines` |
| Quantity take-off, U-value calc | `realize(wall).layers` |
| Framing visualisation, fabrication detail | `realize(wall).parts` |
| Cut list / lumber order | `buildCutList(realize(wall).parts)` |
| IFC export (future) | `realize(wall)` → `ifcWriter.addWall(...)` |

## Roadmap

- [ ] **BalloonFrame openings**: skip studs that fall inside an opening; add headers + jack studs + cripples + window-sill cripples.
- [ ] **Steel-stud variant**: `MetalStudFrame(opts)` — same architecture, C-section profile.
- [ ] **Trusses / I-joists** for floors and roofs (same WallPart pattern, different roles).
- [ ] **IFC writer**: `src/io/IfcWriter.ts` consuming `RealizedWall` (see the IFC discussion in the main README).
- [ ] **Other element types**: `Floor`, `Roof`, `Column`, `Beam` — same `Type-Instance` + `Layers/Parts` + `Psets` pattern, in `src/bim/floors/`, `src/bim/columns/`, etc.

When the BIM layer outgrows the core library it can be lifted into its own package without touching `src/core/`.
