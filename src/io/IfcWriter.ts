// ====================================================================
// IFC Writer — STEP-text exporter (IFC4, Design Transfer View)
// ====================================================================
//
// Produces an `.ifc` file by generating STEP-21 text directly. No
// web-ifc dependency on the write path — the output is plain text you
// can inspect / diff / template.
//
// Coverage:
//   • Project hierarchy: IfcProject → IfcSite → IfcBuilding → IfcBuildingStorey.
//   • Owner history, units (metre + radian), 3D geometric context.
//   • Type / Instance: IfcWallType + IfcRelDefinesByType.
//   • Wall geometry: IfcWallStandardCase with IfcExtrudedAreaSolid
//     (IfcRectangleProfileDef extruded along +Z).
//   • Materials: IfcMaterial + IfcMaterialLayer + IfcMaterialLayerSet +
//     IfcMaterialLayerSetUsage + IfcRelAssociatesMaterial.
//   • Openings: IfcOpeningElement + IfcRelVoidsElement (carve the wall);
//     IfcDoor / IfcWindow + IfcRelFillsElement (fill the opening).
//   • Framed members (studs, plates, headers, …): IfcMember with
//     IfcTriangulatedFaceSet bodies, aggregated under the parent wall
//     via IfcRelAggregates.
//   • Joints: IfcRelConnectsPathElements between adjacent walls; the
//     `style` ("mitered" / "butt") + `throughWall` live in a custom Pset.
//   • Property sets: IfcPropertySet + IfcRelDefinesByProperties for both
//     types and instances (Pset_WallCommon when applicable).

import type { Vec2 } from "../core/math/vectors";
import type { Wall, WallOpening, WallSystem } from "../core/geometry/walls";
import type { PropertyMap, WallType, MaterialLayer } from "../bim/walls/types";
import type { WallJoint } from "../bim/walls/joints";
import type { Slab, SlabType, SlabContext } from "../bim/slabs/types";
import type { OpeningType, DoorOperation, WindowPartitioning } from "../bim/openings";
import type { Space } from "../bim/spaces";
import type { Stair, StairType, StairFlight, StairShape } from "../bim/stairs";

// ─── Options ─────────────────────────────────────────────────────────

export interface IfcWriterOptions {
  projectName?: string;
  projectDescription?: string;
  siteName?: string;
  buildingName?: string;
  storeyName?: string;
  storeyElevation?: number;
  author?: string;
  authorGivenName?: string;
  organization?: string;
  application?: string;
  applicationVersion?: string;
  /** Default: ViewDefinition [DesignTransferView_V1.0] — the round-trippable MVD. */
  viewDefinition?: string;
}

export interface AddWallSystemOptions {
  /** Aggregate framed members (studs, plates, headers) under each wall. Default: true. */
  includeMembers?: boolean;
  /** Emit IfcRelConnectsPathElements for every joint. Default: true. */
  includeJoints?: boolean;
  /** Emit IfcOpeningElement + IfcDoor/IfcWindow for each opening. Default: true. */
  includeOpenings?: boolean;
  /** Emit IfcMaterialLayerSet + IfcMaterialLayerSetUsage from WallType.layers. Default: true. */
  includeMaterials?: boolean;
}

// ─── Writer ──────────────────────────────────────────────────────────

export class IfcWriter {
  private entities: string[] = [];
  private nextId = 1;

  // Bootstrap refs.
  private ownerHistoryRef = 0;
  private contextRef = 0;
  private projectRef = 0;
  private siteRef = 0;
  private buildingRef = 0;
  private buildingPlacementRef = 0;
  private storeyRef = 0;            // default storey ref (the one bootstrapped from `IfcWriterOptions`)
  private storeyPlacementRef = 0;   // its local placement
  private originPointRef = 0;
  private dirXRef = 0;
  private dirZRef = 0;
  private worldPlacementRef = 0;
  private rootPlacementRef = 0;

  // Multi-storey tracking — every storey created via `addStorey` (plus
  // the default one) has its placement ref and its list of contained
  // elements, emitted as one `IfcRelContainedInSpatialStructure` per
  // storey at save time.
  private storeyPlacementByRef = new Map<number, number>(); // storeyRef → placementRef
  private elementsByStorey = new Map<number, number[]>();   // storeyRef → contained element refs

  // Tracking.
  private wallRefs: number[] = [];
  private wallByObject = new Map<Wall, number>();
  private slabRefs: number[] = [];
  private slabTypeRefs = new Map<SlabType, number>();
  private slabDefinesByTypeBatches = new Map<number, number[]>();
  private placementByWall = new Map<Wall, number>(); // wall → its local placement ref
  private wallTypeRefs = new Map<WallType, number>();
  private materialLayerSetRefs = new Map<WallType, number>();
  private materialRefs = new Map<string, number>();
  private definesByTypeBatches = new Map<number, number[]>(); // typeRef → [wallRefs]
  private openingTypeRefs = new Map<OpeningType, number>();
  private openingDefinesByTypeBatches = new Map<number, number[]>(); // door/window typeRef → [instanceRefs]
  private spacesByStorey = new Map<number, number[]>();   // storeyRef → IfcSpace refs (aggregated, not contained)
  private stairTypeRefs = new Map<StairType, number>();
  private stairDefinesByTypeBatches = new Map<number, number[]>();
  /**
   * Per-wall arc-length deltas applied to the body geometry at each end:
   *   • Through wall in a butt joint → extension (negative at start, positive at end).
   *   • Butting wall in a butt joint → shortening (positive at start, negative at end).
   * Populated by `computeWallTrims` before `writeStraightWall` consumes it.
   */
  private wallTrimMap = new Map<Wall, { startDelta: number; endDelta: number }>();

  private readonly opts: Required<IfcWriterOptions>;

  constructor(opts: IfcWriterOptions = {}) {
    this.opts = {
      projectName:        opts.projectName        ?? "Tekto Project",
      projectDescription: opts.projectDescription ?? "",
      siteName:           opts.siteName           ?? "Site",
      buildingName:       opts.buildingName       ?? "Building",
      storeyName:         opts.storeyName         ?? "Ground Floor",
      storeyElevation:    opts.storeyElevation    ?? 0,
      author:             opts.author             ?? "",
      authorGivenName:    opts.authorGivenName    ?? "",
      organization:       opts.organization       ?? "Tekto",
      application:        opts.application        ?? "Tekto",
      applicationVersion: opts.applicationVersion ?? "0.1",
      viewDefinition:     opts.viewDefinition     ?? "ViewDefinition [DesignTransferView_V1.0]",
    };
    this.bootstrap();
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Add an additional `IfcBuildingStorey` to the model and return its
   * line id. Pass that id as `opts.storey` on subsequent `addWall` /
   * `addSlab` / `addWallSystem` calls to attach elements to the new
   * storey. The bootstrap storey (created from `IfcWriterOptions`)
   * stays the default for any call that omits `storey`.
   *
   * @example
   *   const writer = new IfcWriter({ storeyName: "Ground floor", storeyElevation: 0 });
   *   writer.addWallSystem(groundFloorSystem);          // → ground floor
   *   const first = writer.addStorey({ name: "First floor", elevation: 3.0 });
   *   writer.addWallSystem(firstFloorSystem, { storey: first });
   */
  addStorey(opts: { name: string; elevation: number }): number {
    const { storeyRef, placementRef } = this.createStoreyEntities(opts.name, opts.elevation);
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);
    return storeyRef;
  }

  /** Convenience: returns the bootstrap storey's IFC line id. */
  getDefaultStorey(): number { return this.storeyRef; }

  /**
   * Add a `WallSystem` and everything it carries — the recommended one-shot
   * entry point. Emits wall types, materials, walls, openings, members,
   * and joint relations in a single coherent batch.
   *
   * `opts.storey` (optional) selects which storey to attach the walls to.
   * Defaults to the bootstrap storey from `IfcWriterOptions`.
   */
  addWallSystem(system: WallSystem, opts: AddWallSystemOptions & { storey?: number } = {}): void {
    const incMembers   = opts.includeMembers   ?? true;
    const incJoints    = opts.includeJoints    ?? true;
    const incOpenings  = opts.includeOpenings  ?? true;
    const incMaterials = opts.includeMaterials ?? true;

    // Optionally pre-realise so we get parts + material info.
    const realised = incMembers ? system.realize() : null;

    // 0. Pre-compute per-wall body trim from butt joints so the exported
    //    geometry shows the corner detail (through extended, butting
    //    shortened) — receiving tools don't reshape walls from
    //    IfcRelConnectsPathElements alone.
    this.computeWallTrims(system);

    const storey = this.resolveStorey(opts.storey);

    // 1. Walls + types + materials.
    for (const wall of system.walls) {
      const wallRef = this.addWall(wall, { includeMaterials: incMaterials, storey });
      if (incOpenings) {
        for (const op of wall.openings) this.addOpening(wall, wallRef, op, storey);
      }
    }

    // 2. Framed members per wall (aggregated).
    if (incMembers && realised) {
      for (const r of realised) {
        const wallRef = this.wallByObject.get(r.wall);
        if (wallRef == null) continue;
        const memberRefs: number[] = [];
        for (const part of r.parts) {
          if (part.role === "monolithic") continue; // skip the envelope-as-member redundancy
          const ref = this.addMember(wallRef, part);
          memberRefs.push(ref);
        }
        if (memberRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},(${memberRefs.map(r => `#${r}`).join(",")}))`,
          );
        }
      }
    }

    // 3. Joints.
    if (incJoints) {
      for (const j of system.joints) this.addJoint(j);
    }
  }

  /**
   * Add one wall — returns its IFC line id. Used internally by
   * `addWallSystem`; can also be called directly for one-off walls.
   *
   * `opts.storey` selects which storey to attach the wall to. Defaults
   * to the bootstrap storey.
   */
  addWall(wall: Wall, opts: { includeMaterials?: boolean; storey?: number } = {}): number {
    const cl = wall.centerline;
    if (cl.length < 2) throw new Error("IfcWriter.addWall: centerline needs ≥ 2 points");

    const storey = this.resolveStorey(opts.storey);

    // For the typical 2-point wall, emit a single IfcWallStandardCase.
    // For multi-segment polylines, emit one IfcWallStandardCase per segment.
    const refs: number[] = [];
    for (let i = 0; i < cl.length - 1; i++) {
      refs.push(this.writeStraightWall(wall, cl[i], cl[i + 1], i, cl.length - 1, storey));
    }
    const primaryRef = refs[0];
    this.wallByObject.set(wall, primaryRef);
    for (const r of refs) this.attachToStorey(r, storey);

    // Link to a WallType + material layer set, if applicable.
    if (wall.type) {
      const typeRef = this.ensureWallType(wall.type, opts.includeMaterials ?? true);
      const batch = this.definesByTypeBatches.get(typeRef) ?? [];
      batch.push(primaryRef);
      this.definesByTypeBatches.set(typeRef, batch);

      if (opts.includeMaterials ?? true) {
        const layerSetRef = this.materialLayerSetRefs.get(wall.type);
        if (layerSetRef !== undefined) {
          this.writeMaterialLayerSetUsage(primaryRef, layerSetRef, wall);
        }
      }
    }
    return primaryRef;
  }

  /**
   * Add an opening (door or window) on the given wall. Emits
   * IfcOpeningElement + IfcRelVoidsElement (carving the wall) and
   * IfcDoor or IfcWindow + IfcRelFillsElement (filling the void).
   */
  addOpening(wall: Wall, wallRef: number, opening: WallOpening, storeyRef?: number): { openingRef: number; fillRef: number } {
    const isDoor = opening.sillHeight <= 0.001;
    const opHeight = opening.headHeight - opening.sillHeight;
    const opWidth = opening.width;
    const opDepth = wall.thickness;

    // World position of the opening center (XY) on the wall centerline.
    const opCenter = pointAlongCenterline(wall.centerline, opening.centerlinePosition);
    const tangent = tangentAlongCenterline(wall.centerline, opening.centerlinePosition);

    // Opening placement: origin at the centerline point at sill height; +X
    // along the wall tangent; +Z is global up. Body is a centered box of
    // (opWidth × opDepth × opHeight) at the local origin.
    const z = wall.baseElevation + opening.sillHeight;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(opCenter.x)},${ifcReal(opCenter.y)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(tangent.x)},${ifcReal(tangent.y)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storeyRef ?? this.storeyRef) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);

    // Profile centred at local origin (so we don't need to offset).
    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((0.,0.))`);
    const profileAxis2D = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},${"$"})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis2D},${ifcReal(opWidth)},${ifcReal(opDepth)})`,
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(opHeight)})`,
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`,
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const openingName = opening.name ?? (isDoor ? "Door opening" : "Window opening");
    const openingRef = this.addEntity(
      `IFCOPENINGELEMENT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(openingName)},$,$,#${localPlacement},#${productShape},$,.OPENING.)`,
    );
    // IfcRelVoidsElement(GUID,OwnerHistory,Name,Description,RelatingBuildingElement,RelatedOpeningElement)
    this.addEntity(
      `IFCRELVOIDSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${wallRef},#${openingRef})`,
    );

    // Door / Window — reuse the same local placement (the door/window sits
    // at the same world position as the opening). When the opening carries a
    // type, that drives the kind (door vs window) + the operation / partitioning
    // enum (12th attribute); otherwise fall back to the sill-based guess.
    const type = opening.type;
    const asDoor = type ? type.kind === "door" : isDoor;
    const fillName = opening.name ?? type?.name ?? (asDoor ? "Door" : "Window");
    const fillType = asDoor ? "IFCDOOR" : "IFCWINDOW";
    const fillPredefined = asDoor ? ".DOOR." : ".WINDOW.";
    // 12th attribute: IfcDoor.OperationType / IfcWindow.PartitioningType.
    const fillOperation = type
      ? (asDoor ? ifcDoorOperation(type.operation) : ifcWindowPartitioning(type.partitioning))
      : ".NOTDEFINED.";
    const fillRef = this.addEntity(
      `${fillType}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(fillName)},$,$,#${localPlacement},#${productShape},$,${ifcReal(opHeight)},${ifcReal(opWidth)},${fillPredefined},${fillOperation},$)`,
    );
    // IfcRelFillsElement(GUID,OwnerHistory,Name,Description,RelatingOpeningElement,RelatedBuildingElement)
    this.addEntity(
      `IFCRELFILLSELEMENT(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${openingRef},#${fillRef})`,
    );

    // Type link (IfcDoorType / IfcWindowType) + common Pset on the instance.
    if (type) {
      const typeRef = this.ensureOpeningType(type);
      const batch = this.openingDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(fillRef);
      this.openingDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps: PropertyMap = {
      ...(type?.properties ?? {}),
      ...(opening.properties ?? {}),
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(fillRef, asDoor ? "Pset_DoorCommon" : "Pset_WindowCommon", mergedProps);
    }

    return { openingRef, fillRef };
  }

  /**
   * Add a framed member (stud / plate / header / cripple / etc.) as an
   * IfcMember with a tessellated body (IfcTriangulatedFaceSet — efficient,
   * IFC4-native). Aggregating under a wall is the caller's responsibility
   * (see addWallSystem).
   */
  addMember(_parentWallRef: number, part: {
    name: string;
    role: string;
    mesh: import("../core/geometry/mesh/Mesh").Mesh;
    material?: string;
    profile?: { w: number; h: number; name?: string };
    length?: number;
    ifcType?: string;
    properties?: PropertyMap;
  }): number {
    void _parentWallRef; // aggregation done by the caller
    const mesh = part.mesh;
    const positions = mesh.positions;
    const indices = mesh.indices;

    // IfcCartesianPointList3D
    const coords: string[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);

    // IfcTriangulatedFaceSet — IFC uses 1-based indices.
    const tris: string[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`,
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
    const placement = this.addEntity(`IFCLOCALPLACEMENT(#${this.storeyPlacementRef},#${this.worldPlacementRef})`);

    const ifcType = part.ifcType ?? "IfcMember";
    const typeName = ifcType.toUpperCase();
    const memberRef = this.addEntity(
      `${typeName}(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(part.name)},$,${ifcStr(part.role)},#${placement},#${productShape},$,.NOTDEFINED.)`,
    );

    // Attach material if known.
    if (part.material) {
      const matRef = this.ensureMaterial(part.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${memberRef}),#${matRef})`,
      );
    }

    return memberRef;
  }

  /**
   * Add a wall-to-wall joint as IfcRelConnectsPathElements. The joint's
   * style + throughWall hint are exposed in a custom Pset attached to the
   * relation (so receiving applications can read the design intent).
   */
  addJoint(joint: WallJoint): number | null {
    if (joint.walls.length < 2) return null;
    const w0 = this.wallByObject.get(joint.walls[0]);
    const w1 = this.wallByObject.get(joint.walls[1]);
    if (w0 == null || w1 == null) return null;

    const through = joint.throughWall;
    const throughIsW0 = through === joint.walls[0];
    const throughEndAtJoint = endIsAtJoint(through ?? joint.walls[0], joint.ribbonJoint.point);
    const buttingEndAtJoint = endIsAtJoint(throughIsW0 ? joint.walls[1] : joint.walls[0], joint.ribbonJoint.point);
    const throughConnectionType = joint.kind === "T" ? ".ATPATH." : connectionTypeFromEnd(throughEndAtJoint);
    const buttingConnectionType = connectionTypeFromEnd(buttingEndAtJoint);

    const relatingRef = throughIsW0 ? w0 : w1;
    const relatedRef  = throughIsW0 ? w1 : w0;

    const relRef = this.addEntity(
      `IFCRELCONNECTSPATHELEMENTS(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(`${joint.kind}-joint`)},$,$,#${relatingRef},#${relatedRef},(0),(0),${throughConnectionType},${buttingConnectionType})`,
    );

    // Style / through info in a custom Pset on the relation.
    const props: PropertyMap = {
      style: joint.style,
      throughWall: through?.name ?? "",
      kind: joint.kind,
      connectionType: joint.connectionType ?? "unspecified",
      ...joint.properties,
    };
    this.writePset(relRef, "Pset_JointCommon", props);

    return relRef;
  }

  // ── Slabs ────────────────────────────────────────────────────────

  /**
   * Add a slab (floor / ceiling / roof) — returns its IFC line id.
   * Geometry: `IfcExtrudedAreaSolid` with an `IfcArbitraryClosedProfileDef`
   * built from the slab boundary, extruded up by `slab.thickness` from
   * the slab's bottom (`elevation − thickness`).
   *
   * Optionally aggregates SlabParts (joists, sheathing, ceiling) under
   * the slab via `IfcRelAggregates` when `opts.includeParts` is true.
   */
  addSlab(slab: Slab, opts: {
    predefinedType?: "FLOOR" | "ROOF" | "LANDING" | "BASESLAB";
    includeParts?: boolean;
    parts?: import("../bim/slabs/types").SlabPart[];
    /** Storey to attach the slab to. Defaults to the bootstrap storey. */
    storey?: number;
  } = {}): number {
    const storey = this.resolveStorey(opts.storey);
    const boundary = slab.boundary;
    const ring = boundary.length >= 3 && boundary[0].distSqTo(boundary[boundary.length - 1]) < 1e-12
      ? boundary.slice(0, -1)
      : boundary.slice();

    // ── Boundary → IfcCartesianPoint (2D) → IfcPolyline → profile ──
    const ptRefs: number[] = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    // Close the polyline by repeating the first point.
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map(r => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);

    // ── Local placement at the slab's bottom (so +Z extrusion fills up to `elevation`) ──
    const bottomZ = slab.elevation - slab.thickness;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(bottomZ)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storey) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);

    // ── Body: extrude profile up by thickness ──
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(slab.thickness)})`,
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`,
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const slabName = slab.name ?? "Slab";
    const predef = opts.predefinedType ?? "FLOOR";
    const slabRef = this.addEntity(
      `IFCSLAB(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(slabName)},$,$,#${localPlacement},#${productShape},$,.${predef}.)`,
    );
    this.slabRefs.push(slabRef);
    this.attachToStorey(slabRef, storey);

    // ── Pset_SlabCommon ──
    const mergedProps: PropertyMap = {
      ...(slab.type?.properties ?? {}),
      ...(slab.properties ?? {}),
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(slabRef, "Pset_SlabCommon", mergedProps);
    }

    // ── Type link ──
    if (slab.type) {
      const typeRef = this.ensureSlabType(slab.type);
      const batch = this.slabDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(slabRef);
      this.slabDefinesByTypeBatches.set(typeRef, batch);
    }

    // ── Aggregate parts (joists, sheathing, ceiling) ──
    if (opts.includeParts !== false) {
      let parts = opts.parts;
      if (!parts && slab.type?.construction) {
        // Realise here if caller didn't provide parts.
        const ctx: SlabContext | undefined = slab.joistDirection
          ? { joistDirection: slab.joistDirection }
          : undefined;
        parts = slab.type.construction(slab, ctx);
      }
      if (parts && parts.length > 0) {
        const partRefs: number[] = [];
        for (const p of parts) {
          if (p.role === "monolithic") continue;
          partRefs.push(this.addMember(slabRef, p));
        }
        if (partRefs.length > 0) {
          this.addEntity(
            `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${slabRef},(${partRefs.map(r => `#${r}`).join(",")}))`,
          );
        }
      }
    }
    return slabRef;
  }

  private ensureSlabType(type: SlabType): number {
    const existing = this.slabTypeRefs.get(type);
    if (existing !== undefined) return existing;
    const typeRef = this.addEntity(
      `IFCSLABTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.NOTDEFINED.)`,
    );
    this.slabTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_SlabCommon", type.properties);
    }
    return typeRef;
  }

  // ── Stairs ───────────────────────────────────────────────────────

  /**
   * Add a stair as an `IfcStair` that aggregates one `IfcStairFlight` per
   * computed flight. The stair is contained in its storey; flights carry the
   * tessellated step geometry and the riser/tread metrics. A `StairType`
   * links via `IfcRelDefinesByType`; `properties` go on `Pset_StairCommon`.
   */
  addStair(stair: Stair, opts: { storey?: number } = {}): number {
    const storey = this.resolveStorey(opts.storey);

    // Stair coords are absolute world; place relative to the building origin
    // (identity) so the storey elevation isn't double-counted.
    const stairPlacement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`,
    );

    // IfcStair(GlobalId,OwnerHistory,Name,Description,ObjectType,ObjectPlacement,
    //          Representation,Tag,PredefinedType)
    const stairRef = this.addEntity(
      `IFCSTAIR(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(stair.name)},$,$,#${stairPlacement},$,$,${ifcStairShape(stair.type?.shape ?? "straight_run")})`,
    );
    this.attachToStorey(stairRef, storey);

    // Flights → IfcStairFlight, aggregated under the stair.
    const flightRefs: number[] = [];
    for (const flight of stair.flights()) {
      flightRefs.push(this.writeStairFlight(flight, stair.type?.material));
    }
    if (flightRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${stairRef},(${flightRefs.map(r => `#${r}`).join(",")}))`,
      );
    }

    // Type link + common Pset.
    if (stair.type) {
      const typeRef = this.ensureStairType(stair.type);
      const batch = this.stairDefinesByTypeBatches.get(typeRef) ?? [];
      batch.push(stairRef);
      this.stairDefinesByTypeBatches.set(typeRef, batch);
    }
    const mergedProps: PropertyMap = {
      ...(stair.type?.properties ?? {}),
      ...stair.properties,
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(stairRef, "Pset_StairCommon", mergedProps);
    }
    return stairRef;
  }

  private writeStairFlight(flight: StairFlight, material?: string): number {
    const productShape = this.writeTriangulatedShape(flight.positions, flight.indices);
    const placement = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${this.worldPlacementRef})`,
    );
    // IfcStairFlight(...,NumberOfRisers,NumberOfTreads,RiserHeight,TreadLength,PredefinedType)
    const flightRef = this.addEntity(
      `IFCSTAIRFLIGHT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(flight.name)},$,$,#${placement},#${productShape},$,${flight.risers},${flight.treads},${ifcReal(flight.riserHeight)},${ifcReal(flight.treadDepth)},.STRAIGHT.)`,
    );
    if (material) {
      const matRef = this.ensureMaterial(material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${flightRef}),#${matRef})`,
      );
    }
    return flightRef;
  }

  private ensureStairType(type: StairType): number {
    const existing = this.stairTypeRefs.get(type);
    if (existing !== undefined) return existing;
    // IfcStairType(...,ElementType,PredefinedType)
    const typeRef = this.addEntity(
      `IFCSTAIRTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,${ifcStairShape(type.shape)})`,
    );
    this.stairTypeRefs.set(type, typeRef);
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_StairCommon", type.properties);
    }
    return typeRef;
  }

  /**
   * Emit a tessellated solid (IfcCartesianPointList3D + IfcTriangulatedFaceSet)
   * from a flat positions array and 0-based triangle indices. Returns the
   * IfcProductDefinitionShape ref.
   */
  private writeTriangulatedShape(positions: number[], indices: number[]): number {
    const coords: string[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      coords.push(`(${ifcReal(positions[i])},${ifcReal(positions[i + 1])},${ifcReal(positions[i + 2])})`);
    }
    const pointListRef = this.addEntity(`IFCCARTESIANPOINTLIST3D((${coords.join(",")}))`);
    const tris: string[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      tris.push(`(${indices[i] + 1},${indices[i + 1] + 1},${indices[i + 2] + 1})`);
    }
    const faceSet = this.addEntity(`IFCTRIANGULATEDFACESET(#${pointListRef},$,$,(${tris.join(",")}),$)`);
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','Tessellation',(#${faceSet}))`,
    );
    return this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);
  }

  // ── Spaces (rooms) ───────────────────────────────────────────────

  /**
   * Add a room as an `IfcSpace` — returns its IFC line id. Geometry is the
   * boundary polygon extruded up by `space.height` from `space.elevation`.
   * The space is aggregated under its storey via `IfcRelAggregates` (the
   * correct spatial-decomposition relationship for spaces), its `function`
   * becomes `IfcSpace.LongName`, and `properties` go on `Pset_SpaceCommon`.
   *
   * `opts.boundaries` — walls that bound the room (e.g. from
   * `boundingWalls(space, walls)`). Each already-added wall emits an
   * `IfcRelSpaceBoundary` (PHYSICAL; INTERNAL/EXTERNAL from the wall's
   * `isExternal` property). Walls not yet added to the writer are skipped.
   */
  addSpace(space: Space, opts: { storey?: number; boundaries?: Wall[] } = {}): number {
    const storey = this.resolveStorey(opts.storey);
    const ring = space.boundary[0].distSqTo(space.boundary[space.boundary.length - 1]) < 1e-12
      ? space.boundary.slice(0, -1)
      : space.boundary.slice();

    // Boundary → IfcPolyline → closed profile.
    const ptRefs: number[] = [];
    for (const p of ring) {
      ptRefs.push(this.addEntity(`IFCCARTESIANPOINT((${ifcReal(p.x)},${ifcReal(p.y)}))`));
    }
    const closedPts = [...ptRefs, ptRefs[0]];
    const polyline = this.addEntity(`IFCPOLYLINE((${closedPts.map(r => `#${r}`).join(",")}))`);
    const profile = this.addEntity(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,#${polyline})`);

    // Local placement at the floor level; extrude up by clear height.
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(space.elevation)}))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${this.dirXRef})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storey) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);

    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(space.height)})`,
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`,
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    // IfcSpace(GlobalId,OwnerHistory,Name,Description,ObjectType,ObjectPlacement,
    //          Representation,LongName,CompositionType,PredefinedType,ElevationWithFlooring)
    const spaceRef = this.addEntity(
      `IFCSPACE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(space.name)},$,$,#${localPlacement},#${productShape},${ifcOpt(space.function ?? "")},.ELEMENT.,.INTERNAL.,$)`,
    );
    const list = this.spacesByStorey.get(storey) ?? [];
    list.push(spaceRef);
    this.spacesByStorey.set(storey, list);

    // Pset_SpaceCommon — fold in a computed GrossFloorArea unless overridden.
    const props: PropertyMap = {
      GrossFloorArea: round3(space.area()),
      ...space.properties,
    };
    this.writePset(spaceRef, "Pset_SpaceCommon", props);

    // Space boundaries → IfcRelSpaceBoundary to each already-added wall.
    if (opts.boundaries) {
      for (const wall of opts.boundaries) {
        const wallRef = this.wallByObject.get(wall);
        if (wallRef == null) continue; // wall not added to this writer — skip
        const ext = isExternalWall(wall) ? ".EXTERNAL." : ".INTERNAL.";
        this.addEntity(
          `IFCRELSPACEBOUNDARY(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${spaceRef},#${wallRef},$,.PHYSICAL.,${ext})`,
        );
      }
    }

    return spaceRef;
  }

  /**
   * Ensure an `IfcDoorType` / `IfcWindowType` exists for this opening type,
   * returning its line id. Door types carry an OperationType; window types
   * carry a PartitioningType. The type's `properties` go on a common Pset.
   */
  private ensureOpeningType(type: OpeningType): number {
    const existing = this.openingTypeRefs.get(type);
    if (existing !== undefined) return existing;

    let typeRef: number;
    if (type.kind === "door") {
      // IfcDoorType(...,ElementType,PredefinedType,OperationType,ParameterTakesPrecedence,UserDefinedOperationType)
      typeRef = this.addEntity(
        `IFCDOORTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.DOOR.,${ifcDoorOperation(type.operation)},$,$)`,
      );
    } else {
      // IfcWindowType(...,ElementType,PredefinedType,PartitioningType,ParameterTakesPrecedence,UserDefinedPartitioningType)
      typeRef = this.addEntity(
        `IFCWINDOWTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.WINDOW.,${ifcWindowPartitioning(type.partitioning)},$,$)`,
      );
    }
    this.openingTypeRefs.set(type, typeRef);

    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, type.kind === "door" ? "Pset_DoorCommon" : "Pset_WindowCommon", type.properties);
    }
    if (type.material) {
      const matRef = this.ensureMaterial(type.material);
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${matRef})`,
      );
    }
    return typeRef;
  }

  // ── Save ──────────────────────────────────────────────────────────

  save(): string {
    this.flushDefinesByType();
    this.linkSpatialStructure();
    return this.assembleStep();
  }

  saveBytes(): Uint8Array { return new TextEncoder().encode(this.save()); }
  saveBlob():  Blob       { return new Blob([this.save()], { type: "application/ifc" }); }

  // ── Bootstrap ────────────────────────────────────────────────────

  private bootstrap(): void {
    this.originPointRef = this.addEntity(`IFCCARTESIANPOINT((0.,0.,0.))`);
    this.dirXRef = this.addEntity(`IFCDIRECTION((1.,0.,0.))`);
    this.dirZRef = this.addEntity(`IFCDIRECTION((0.,0.,1.))`);
    this.worldPlacementRef = this.addEntity(
      `IFCAXIS2PLACEMENT3D(#${this.originPointRef},#${this.dirZRef},#${this.dirXRef})`,
    );

    const person = this.addEntity(
      `IFCPERSON($,${ifcOpt(this.opts.author)},${ifcOpt(this.opts.authorGivenName)},$,$,$,$,$)`,
    );
    const org = this.addEntity(`IFCORGANIZATION($,${ifcStr(this.opts.organization)},$,$,$)`);
    const personAndOrg = this.addEntity(`IFCPERSONANDORGANIZATION(#${person},#${org},$)`);
    const app = this.addEntity(
      `IFCAPPLICATION(#${org},${ifcStr(this.opts.applicationVersion)},${ifcStr(this.opts.application)},${ifcStr(this.opts.application.toLowerCase())})`,
    );
    const epoch = 1700000000;
    this.ownerHistoryRef = this.addEntity(
      `IFCOWNERHISTORY(#${personAndOrg},#${app},$,.ADDED.,$,$,$,${epoch})`,
    );

    const metre = this.addEntity(`IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);
    const radian = this.addEntity(`IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`);
    const squareMetre = this.addEntity(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);
    const cubicMetre = this.addEntity(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`);
    const unitAssign = this.addEntity(
      `IFCUNITASSIGNMENT((#${metre},#${squareMetre},#${cubicMetre},#${radian}))`,
    );

    this.contextRef = this.addEntity(
      `IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,#${this.worldPlacementRef},$)`,
    );

    this.projectRef = this.addEntity(
      `IFCPROJECT(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.projectName)},${ifcOpt(this.opts.projectDescription)},$,$,$,(#${this.contextRef}),#${unitAssign})`,
    );

    this.rootPlacementRef = this.addEntity(`IFCLOCALPLACEMENT($,#${this.worldPlacementRef})`);
    this.siteRef = this.addEntity(
      `IFCSITE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.siteName)},$,$,#${this.rootPlacementRef},$,$,.ELEMENT.,$,$,$,$,$)`,
    );

    this.buildingPlacementRef = this.addEntity(
      `IFCLOCALPLACEMENT(#${this.rootPlacementRef},#${this.worldPlacementRef})`,
    );
    this.buildingRef = this.addEntity(
      `IFCBUILDING(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(this.opts.buildingName)},$,$,#${this.buildingPlacementRef},$,$,.ELEMENT.,$,$,$)`,
    );

    // Default ground-floor storey from options. Additional storeys are
    // appended later via `addStorey`.
    const { storeyRef, placementRef } = this.createStoreyEntities(
      this.opts.storeyName, this.opts.storeyElevation,
    );
    this.storeyRef = storeyRef;
    this.storeyPlacementRef = placementRef;
    this.storeyPlacementByRef.set(storeyRef, placementRef);
    this.elementsByStorey.set(storeyRef, []);

    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.projectRef},(#${this.siteRef}))`);
    this.addEntity(`IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.siteRef},(#${this.buildingRef}))`);
    // Building → storeys aggregation is emitted at save time (after any
    // additional storeys have been added).
  }

  /** Build the IfcBuildingStorey + IfcLocalPlacement pair. Returns both refs. */
  private createStoreyEntities(name: string, elevation: number): { storeyRef: number; placementRef: number } {
    const originPt = this.addEntity(`IFCCARTESIANPOINT((0.,0.,${ifcReal(elevation)}))`);
    const axis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${originPt},#${this.dirZRef},#${this.dirXRef})`);
    const placementRef = this.addEntity(`IFCLOCALPLACEMENT(#${this.buildingPlacementRef},#${axis})`);
    const storeyRef = this.addEntity(
      `IFCBUILDINGSTOREY(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,$,#${placementRef},$,$,.ELEMENT.,${ifcReal(elevation)})`,
    );
    return { storeyRef, placementRef };
  }

  // ── Wall geometry ────────────────────────────────────────────────

  /**
   * Per-wall deltas from butt joints. Sign convention along the wall's
   * tangent (p0 → p1):
   *   - Through wall, start at joint → startDelta negative (extend back)
   *   - Through wall, end at joint   → endDelta   positive (extend fwd)
   *   - Butting wall, start at joint → startDelta positive (shorten in)
   *   - Butting wall, end at joint   → endDelta   negative (shorten in)
   * Mitered joints leave deltas at 0 — both walls meet at centerline.
   */
  private computeWallTrims(system: WallSystem): void {
    this.wallTrimMap.clear();
    for (const w of system.walls) {
      this.wallTrimMap.set(w, { startDelta: 0, endDelta: 0 });
    }
    for (const joint of system.joints) {
      if (joint.style !== "butt") continue;
      const through = joint.throughWall;
      if (!through) continue;
      const halfThrough = through.thickness * 0.5;
      const buttings = joint.walls.filter(w => w !== through);
      const maxButtHalfW = buttings.reduce((m, w) => Math.max(m, w.thickness * 0.5), 0);

      for (const wall of joint.walls) {
        const trim = this.wallTrimMap.get(wall);
        if (!trim) continue;
        const endPos = endIsAtJoint(wall, joint.ribbonJoint.point);
        if (wall === through) {
          if (endPos === "start") trim.startDelta -= maxButtHalfW;
          else if (endPos === "end") trim.endDelta += maxButtHalfW;
          // T-junction interior → no trim.
        } else {
          if (endPos === "start") trim.startDelta += halfThrough;
          else if (endPos === "end") trim.endDelta -= halfThrough;
        }
      }
    }
  }

  private writeStraightWall(wall: Wall, p0: Vec2, p1: Vec2, segIndex: number, segTotal: number, storeyRef?: number): number {
    // Original centerline tangent + length (used to project the trim deltas).
    const rawDx = p1.x - p0.x;
    const rawDy = p1.y - p0.y;
    const rawLen = Math.hypot(rawDx, rawDy);
    if (rawLen < 1e-9) throw new Error("IfcWriter: zero-length wall segment");
    const ux = rawDx / rawLen;
    const uy = rawDy / rawLen;

    // Apply per-wall body trim — only to the outermost ends of multi-
    // segment walls (first segment's p0, last segment's p1).
    const trim = this.wallTrimMap.get(wall);
    let startX = p0.x, startY = p0.y;
    let endX = p1.x, endY = p1.y;
    if (trim) {
      if (segIndex === 0) {
        startX = p0.x + ux * trim.startDelta;
        startY = p0.y + uy * trim.startDelta;
      }
      if (segIndex === segTotal - 1) {
        endX = p1.x + ux * trim.endDelta;
        endY = p1.y + uy * trim.endDelta;
      }
    }
    const length = Math.hypot(endX - startX, endY - startY);
    if (length < 1e-9) throw new Error("IfcWriter: zero-length trimmed wall segment");

    const z = wall.baseElevation;
    const placementPt = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(startX)},${ifcReal(startY)},${ifcReal(z)}))`);
    const refDir = this.addEntity(`IFCDIRECTION((${ifcReal(ux)},${ifcReal(uy)},0.))`);
    const placementAxis = this.addEntity(`IFCAXIS2PLACEMENT3D(#${placementPt},#${this.dirZRef},#${refDir})`);
    const parentPlacementRef = this.storeyPlacementByRef.get(storeyRef ?? this.storeyRef) ?? this.storeyPlacementRef;
    const localPlacement = this.addEntity(`IFCLOCALPLACEMENT(#${parentPlacementRef},#${placementAxis})`);

    const profileOrigin = this.addEntity(`IFCCARTESIANPOINT((${ifcReal(length / 2)},0.))`);
    const profileAxisDir = this.addEntity(`IFCDIRECTION((1.,0.))`);
    const profileAxis = this.addEntity(`IFCAXIS2PLACEMENT2D(#${profileOrigin},#${profileAxisDir})`);
    const profile = this.addEntity(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis},${ifcReal(length)},${ifcReal(wall.thickness)})`,
    );
    const extrusion = this.addEntity(
      `IFCEXTRUDEDAREASOLID(#${profile},#${this.worldPlacementRef},#${this.dirZRef},${ifcReal(wall.height)})`,
    );
    const shapeRep = this.addEntity(
      `IFCSHAPEREPRESENTATION(#${this.contextRef},'Body','SweptSolid',(#${extrusion}))`,
    );
    const productShape = this.addEntity(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRep}))`);

    const wallName = segTotal > 1
      ? `${wall.name ?? "Wall"}_${segIndex + 1}`
      : (wall.name ?? "Wall");
    const wallRef = this.addEntity(
      `IFCWALLSTANDARDCASE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(wallName)},$,$,#${localPlacement},#${productShape},$,.NOTDEFINED.)`,
    );
    this.wallRefs.push(wallRef);
    this.placementByWall.set(wall, localPlacement);

    // Pset_WallCommon on the instance (merged type + instance props).
    const mergedProps: PropertyMap = {
      ...(wall.type?.properties ?? {}),
      ...(wall.properties ?? {}),
    };
    if (Object.keys(mergedProps).length > 0) {
      this.writePset(wallRef, "Pset_WallCommon", mergedProps);
    }
    return wallRef;
  }

  // ── Wall type registry ──────────────────────────────────────────

  private ensureWallType(type: WallType, includeMaterials: boolean): number {
    const existing = this.wallTypeRefs.get(type);
    if (existing !== undefined) return existing;

    const typeRef = this.addEntity(
      `IFCWALLTYPE(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(type.name)},${ifcOpt(type.description ?? "")},$,$,$,$,$,.NOTDEFINED.)`,
    );
    this.wallTypeRefs.set(type, typeRef);

    // Pset on the type carrying the WallType.properties.
    if (type.properties && Object.keys(type.properties).length > 0) {
      this.writePset(typeRef, "Pset_WallCommon", type.properties);
    }
    // Materials + layer set tied to the type.
    if (includeMaterials && type.layers && type.layers.length > 0) {
      const layerSetRef = this.writeMaterialLayerSet(type.layers, type.name);
      this.materialLayerSetRefs.set(type, layerSetRef);
      // Associate the layer set with the type.
      this.addEntity(
        `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${typeRef}),#${layerSetRef})`,
      );
    }
    return typeRef;
  }

  private flushDefinesByType(): void {
    for (const [typeRef, wallRefs] of this.definesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${wallRefs.map(r => `#${r}`).join(",")}),#${typeRef})`,
      );
    }
    for (const [typeRef, slabRefs] of this.slabDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${slabRefs.map(r => `#${r}`).join(",")}),#${typeRef})`,
      );
    }
    for (const [typeRef, instanceRefs] of this.openingDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${instanceRefs.map(r => `#${r}`).join(",")}),#${typeRef})`,
      );
    }
    for (const [typeRef, stairRefs] of this.stairDefinesByTypeBatches) {
      this.addEntity(
        `IFCRELDEFINESBYTYPE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${stairRefs.map(r => `#${r}`).join(",")}),#${typeRef})`,
      );
    }
  }

  // ── Materials ────────────────────────────────────────────────────

  private ensureMaterial(name: string): number {
    const existing = this.materialRefs.get(name);
    if (existing !== undefined) return existing;
    const ref = this.addEntity(`IFCMATERIAL(${ifcStr(name)},$,$)`);
    this.materialRefs.set(name, ref);
    return ref;
  }

  private writeMaterialLayerSet(layers: MaterialLayer[], setName: string): number {
    const layerRefs: number[] = [];
    for (const l of layers) {
      const matRef = this.ensureMaterial(l.material);
      // IfcMaterialLayer(Material, LayerThickness, IsVentilated, Name, Description, Category, Priority)
      const layerRef = this.addEntity(
        `IFCMATERIALLAYER(#${matRef},${ifcReal(l.thickness)},$,$,$,$,$)`,
      );
      layerRefs.push(layerRef);
    }
    const layerSetRef = this.addEntity(
      `IFCMATERIALLAYERSET((${layerRefs.map(r => `#${r}`).join(",")}),${ifcStr(setName)},$)`,
    );
    return layerSetRef;
  }

  private writeMaterialLayerSetUsage(wallRef: number, layerSetRef: number, wall: Wall): void {
    // Offset = thickness / 2 puts the axis at the wall centerline (the IFC
    // convention is that LayerSetDirection is +Y and OffsetFromReferenceLine
    // is signed distance from the layer set start to the axis).
    const offset = -wall.thickness * 0.5;
    const usageRef = this.addEntity(
      `IFCMATERIALLAYERSETUSAGE(#${layerSetRef},.AXIS2.,.POSITIVE.,${ifcReal(offset)},$)`,
    );
    this.addEntity(
      `IFCRELASSOCIATESMATERIAL(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${wallRef}),#${usageRef})`,
    );
  }

  // ── Property sets ───────────────────────────────────────────────

  private writePset(elementRef: number, name: string, props: PropertyMap): void {
    const propRefs: number[] = [];
    for (const [key, value] of Object.entries(props)) {
      propRefs.push(this.writeSingleValue(key, value));
    }
    if (propRefs.length === 0) return;
    const psetRef = this.addEntity(
      `IFCPROPERTYSET(${ifcGuid()},#${this.ownerHistoryRef},${ifcStr(name)},$,(${propRefs.map(r => `#${r}`).join(",")}))`,
    );
    this.addEntity(
      `IFCRELDEFINESBYPROPERTIES(${ifcGuid()},#${this.ownerHistoryRef},$,$,(#${elementRef}),#${psetRef})`,
    );
  }

  private writeSingleValue(name: string, value: unknown): number {
    return this.addEntity(`IFCPROPERTYSINGLEVALUE(${ifcStr(name)},$,${ifcTypedValue(value)},$)`);
  }

  // ── Spatial linking ─────────────────────────────────────────────

  /** Validate / default the storey ref for an add* call. */
  private resolveStorey(storeyRef?: number): number {
    if (storeyRef == null) return this.storeyRef;
    if (!this.elementsByStorey.has(storeyRef)) {
      throw new Error(
        `IfcWriter: unknown storey ref #${storeyRef} (must come from addStorey() or getDefaultStorey()).`,
      );
    }
    return storeyRef;
  }

  /** Record an element ref under its storey for later spatial linking. */
  private attachToStorey(elementRef: number, storeyRef: number): void {
    const list = this.elementsByStorey.get(storeyRef);
    if (list) list.push(elementRef);
  }

  private linkSpatialStructure(): void {
    // Building → all storeys.
    const storeyRefs = Array.from(this.elementsByStorey.keys());
    if (storeyRefs.length > 0) {
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${this.buildingRef},(${storeyRefs.map(r => `#${r}`).join(",")}))`,
      );
    }
    // Each storey → its contained elements (skip empty storeys).
    for (const [storeyRef, elements] of this.elementsByStorey) {
      if (elements.length === 0) continue;
      const list = elements.map(r => `#${r}`).join(",");
      this.addEntity(
        `IFCRELCONTAINEDINSPATIALSTRUCTURE(${ifcGuid()},#${this.ownerHistoryRef},$,$,(${list}),#${storeyRef})`,
      );
    }
    // Each storey → its spaces (spatial decomposition, not containment).
    for (const [storeyRef, spaces] of this.spacesByStorey) {
      if (spaces.length === 0) continue;
      const list = spaces.map(r => `#${r}`).join(",");
      this.addEntity(
        `IFCRELAGGREGATES(${ifcGuid()},#${this.ownerHistoryRef},$,$,#${storeyRef},(${list}))`,
      );
    }
  }

  // ── Plumbing ────────────────────────────────────────────────────

  private addEntity(content: string): number {
    const id = this.nextId++;
    this.entities.push(`#${id}=${content};`);
    return id;
  }

  private assembleStep(): string {
    const date = new Date().toISOString().replace(/\.\d+Z$/, "");
    const filename = `${(this.opts.projectName || "model").replace(/[^\w-]/g, "_")}.ifc`;
    const header =
      `HEADER;\n` +
      `FILE_DESCRIPTION((${ifcStr(this.opts.viewDefinition)}),'2;1');\n` +
      `FILE_NAME(${ifcStr(filename)},${ifcStr(date)},(${ifcStr(this.opts.author)}),(${ifcStr(this.opts.organization)}),${ifcStr(this.opts.application + " " + this.opts.applicationVersion)},${ifcStr(this.opts.application)},'');\n` +
      `FILE_SCHEMA(('IFC4'));\n` +
      `ENDSEC;`;
    return `ISO-10303-21;\n${header}\nDATA;\n${this.entities.join("\n")}\nENDSEC;\nEND-ISO-10303-21;\n`;
  }
}

// ─── STEP-encoding helpers ─────────────────────────────────────────

function ifcStr(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function ifcOpt(s: string): string {
  return s ? ifcStr(s) : "$";
}

function ifcReal(n: number): string {
  if (!Number.isFinite(n)) return "0.";
  const s = n.toString();
  return s.includes(".") || s.includes("e") || s.includes("E") ? s : `${s}.`;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Read the `isExternal` flag from a wall's instance or type property set. */
function isExternalWall(wall: Wall): boolean {
  return wall.properties?.isExternal === true || wall.type?.properties?.isExternal === true;
}

function ifcTypedValue(v: unknown): string {
  if (typeof v === "string")  return `IFCTEXT(${ifcStr(v)})`;
  if (typeof v === "boolean") return `IFCBOOLEAN(${v ? ".T." : ".F."})`;
  if (typeof v === "number")  return `IFCREAL(${ifcReal(v)})`;
  return `IFCTEXT(${ifcStr(String(v))})`;
}

function ifcGuid(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  let s = "";
  for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * 64)];
  return `'${s}'`;
}

// ─── Door / window enum mapping (IfcDoorTypeOperationEnum etc.) ─────

function ifcDoorOperation(op: DoorOperation): string {
  switch (op) {
    case "single_swing_left":        return ".SINGLE_SWING_LEFT.";
    case "single_swing_right":       return ".SINGLE_SWING_RIGHT.";
    case "double_swing":             return ".DOUBLE_DOOR_DOUBLE_SWING.";
    case "double_door_single_swing": return ".DOUBLE_DOOR_SINGLE_SWING.";
    case "sliding":                  return ".SLIDING_TO_LEFT.";
    case "folding":                  return ".FOLDING_TO_LEFT.";
    case "revolving":                return ".REVOLVING.";
    default:                         return ".NOTDEFINED.";
  }
}

function ifcWindowPartitioning(p: WindowPartitioning): string {
  switch (p) {
    case "single_panel":             return ".SINGLE_PANEL.";
    case "double_panel_vertical":    return ".DOUBLE_PANEL_VERTICAL.";
    case "double_panel_horizontal":  return ".DOUBLE_PANEL_HORIZONTAL.";
    case "triple_panel":             return ".TRIPLE_PANEL_VERTICAL.";
    default:                         return ".NOTDEFINED.";
  }
}

function ifcStairShape(s: StairShape): string {
  switch (s) {
    case "straight_run":      return ".STRAIGHT_RUN.";
    case "two_straight_run":  return ".TWO_STRAIGHT_RUN_STAIR.";
    case "quarter_turn":      return ".QUARTER_TURN_STAIR.";
    case "half_turn":         return ".HALF_TURN_STAIR.";
    case "spiral":            return ".SPIRAL_STAIR.";
    default:                  return ".NOTDEFINED.";
  }
}

// ─── Geometry helpers (centerline arc-length walking) ─────────────

function pointAlongCenterline(cl: Vec2[], m: number): { x: number; y: number } {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx = cl[i + 1].x - cl[i].x;
    const dy = cl[i + 1].y - cl[i].y;
    const len = Math.hypot(dx, dy);
    if (m <= acc + len) {
      const t = len > 1e-9 ? (m - acc) / len : 0;
      return { x: cl[i].x + dx * t, y: cl[i].y + dy * t };
    }
    acc += len;
  }
  const last = cl[cl.length - 1];
  return { x: last.x, y: last.y };
}

function tangentAlongCenterline(cl: Vec2[], m: number): { x: number; y: number } {
  let acc = 0;
  for (let i = 0; i < cl.length - 1; i++) {
    const dx = cl[i + 1].x - cl[i].x;
    const dy = cl[i + 1].y - cl[i].y;
    const len = Math.hypot(dx, dy);
    if (m <= acc + len) {
      return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
    }
    acc += len;
  }
  const n = cl.length;
  const dx = cl[n - 1].x - cl[n - 2].x;
  const dy = cl[n - 1].y - cl[n - 2].y;
  const len = Math.hypot(dx, dy);
  return len > 1e-9 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };
}

function endIsAtJoint(wall: Wall, pt: Vec2): "start" | "end" | "interior" {
  const cl = wall.centerline;
  const startDist = Math.hypot(pt.x - cl[0].x, pt.y - cl[0].y);
  const endDist = Math.hypot(pt.x - cl[cl.length - 1].x, pt.y - cl[cl.length - 1].y);
  if (startDist < 1e-3) return "start";
  if (endDist < 1e-3) return "end";
  return "interior";
}

function connectionTypeFromEnd(end: "start" | "end" | "interior"): string {
  if (end === "start") return ".ATSTART.";
  if (end === "end")   return ".ATEND.";
  return ".ATPATH.";
}
