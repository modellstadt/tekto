/**
 * The chainable handles a 3D sketch returns from `lab.mesh(…)`, `lab.point(…)`, `lab.line(…)`,
 * `lab.polyline(…)` and the shape calls: each wraps one scene object and restyles, moves or
 * measures it in place (`lab.mesh(m).color("#f80").rotateZ(0.3)`).
 */
import type { Scene, SceneObject, VisualStyle, FlatMeshData } from "../scene/Scene";
import type { Mesh } from "../core/geometry/mesh/Mesh";
import { MeshFactory } from "../core/geometry/mesh/MeshFactory";
import { Algo } from "../core/algo/algorithms";
import { Vec3 } from "../core/math/vectors";
import type { MeshHandle, PointHandle, LineHandle, ShapeHandle } from "./SketchTypes";

export function meshHandle(scene: Scene, mesh: Mesh, style?: Partial<VisualStyle>): MeshHandle {
  const obj = scene.addMesh(mesh, style);
  const handle: MeshHandle = {
    get id() { return obj.id; },
    get mesh() { return mesh; },

    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    opacity(o) { scene.setStyle(obj.id, { opacity: o }); return handle; },
    wireframe(w = true) { scene.setStyle(obj.id, { wireframe: w }); return handle; },
    visible(v = true) { scene.setStyle(obj.id, { visible: v }); return handle; },
    label(l) { scene.setStyle(obj.id, { label: l }); return handle; },
    labelScale(s) { scene.setStyle(obj.id, { labelScale: s }); return handle; },
    doubleSided(d = true) { scene.setStyle(obj.id, { doubleSided: d }); return handle; },
    backfaceColor(c) { scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
    groupColor(_name, _color) { return handle; },
    noExport(v = true) { scene.setStyle(obj.id, { noExport: v }); return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
    printLayers(heightM) { scene.setStyle(obj.id, { printLayerH: heightM }); return handle; },

    translate(x, y, z) {
      for (const n of mesh.nodes()) {
        n.position = n.position.add(new Vec3(x, y, z));
      }
      mesh.computeVertexNormals();
      scene.update(obj.id, { mesh });
      return handle;
    },

    scale(s) {
      for (const n of mesh.nodes()) {
        n.position = n.position.mul(s);
      }
      mesh.computeVertexNormals();
      scene.update(obj.id, { mesh });
      return handle;
    },

    rotateX(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      for (const n of mesh.nodes()) {
        const p = n.position;
        n.position = new Vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
      }
      mesh.computeVertexNormals();
      scene.update(obj.id, { mesh });
      return handle;
    },

    rotateY(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      for (const n of mesh.nodes()) {
        const p = n.position;
        n.position = new Vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
      }
      mesh.computeVertexNormals();
      scene.update(obj.id, { mesh });
      return handle;
    },

    rotateZ(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      for (const n of mesh.nodes()) {
        const p = n.position;
        n.position = new Vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
      }
      mesh.computeVertexNormals();
      scene.update(obj.id, { mesh });
      return handle;
    },

    subdivide(iterations = 1, opts?: { creaseAngleDeg?: number; creaseEdge?: (a: Vec3, b: Vec3) => boolean; pinVertex?: (p: Vec3) => boolean }) {
      let m = mesh;
      for (let i = 0; i < iterations; i++) m = MeshFactory.subdivide(m, opts);
      scene.remove(obj.id);
      return meshHandle(scene, m, obj.style);
    },

    smooth(iterations = 1, factor = 0.5) {
      Algo.laplacianSmooth(mesh, iterations, factor);
      scene.update(obj.id, { mesh });
      return handle;
    },

    volume() { return Algo.meshVolume(mesh); },
    surfaceArea() { return Algo.meshSurfaceArea(mesh); },
    nodeCount() { return mesh.nodeCount; },
    faceCount() { return mesh.faceCount; },
    edgeCount() { return mesh.edgeCount; },
  };

  return handle;
}

export function flatMeshHandle(scene: Scene, data: FlatMeshData, style?: Partial<VisualStyle>): MeshHandle {
  const obj = scene.addFlatMesh(data, style);
  // FlatMeshHandle supports style changes but not geometry transforms
  const handle: MeshHandle = {
    get id() { return obj.id; },
    get mesh() { return null as any; }, // flat data has no Mesh object behind it
    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    opacity(o) { scene.setStyle(obj.id, { opacity: o }); return handle; },
    wireframe(w = true) { scene.setStyle(obj.id, { wireframe: w }); return handle; },
    visible(v = true) { scene.setStyle(obj.id, { visible: v }); return handle; },
    label(l) { scene.setStyle(obj.id, { label: l }); return handle; },
    labelScale(s) { scene.setStyle(obj.id, { labelScale: s }); return handle; },
    doubleSided(d = true) { scene.setStyle(obj.id, { doubleSided: d }); return handle; },
    backfaceColor(c) { scene.setStyle(obj.id, { backfaceColor: c, doubleSided: !!c }); return handle; },
    groupColor(name, color) {
      const existing = scene.get(obj.id)?.style.groupColors ?? {};
      scene.setStyle(obj.id, { groupColors: { ...existing, [name]: color } });
      return handle;
    },
    noExport(v = true) { scene.setStyle(obj.id, { noExport: v }); return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
    printLayers(heightM) { scene.setStyle(obj.id, { printLayerH: heightM }); return handle; },
    translate() { return handle; },
    scale() { return handle; },
    rotateX() { return handle; },
    rotateY() { return handle; },
    rotateZ() { return handle; },
    subdivide() { return handle; },
    smooth() { return handle; },
    volume() { return 0; },
    surfaceArea() { return 0; },
    nodeCount() { return data.positions.length / 3; },
    faceCount() { return data.indices.length / 3; },
    edgeCount() { return 0; },
  };
  return handle;
}

export function pointHandle(scene: Scene, pos: Vec3): PointHandle {
  const obj = scene.addPoint(pos);
  const handle: PointHandle = {
    get id() { return obj.id; },
    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    size(s) { scene.setStyle(obj.id, { pointSize: s }); return handle; },
    label(l) { scene.setStyle(obj.id, { label: l }); return handle; },
    labelScale(s) { scene.setStyle(obj.id, { labelScale: s }); return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
    moveTo(x, y, z) { scene.update(obj.id, { position: new Vec3(x, y, z) }); return handle; },
    position() { return scene.get(obj.id)?.position ?? pos; },
  };
  return handle;
}

export function lineHandle(scene: Scene, a: Vec3, b: Vec3): LineHandle {
  const obj = scene.addSegment(a, b);
  const handle: LineHandle = {
    get id() { return obj.id; },
    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    opacity(o) { scene.setStyle(obj.id, { opacity: o }); return handle; },
    radius(r) { scene.setStyle(obj.id, { tubeRadius: r }); return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
    dashed(size, gap) { scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } }); return handle; },
    pickTag(tag) { scene.update(obj.id, { pickTag: tag }); return handle; },
    pickable(p = true) { scene.update(obj.id, { pickable: p }); return handle; },
  };
  return handle;
}

export function polylineHandle(scene: Scene, points: Vec3[]): LineHandle {
  const obj = scene.addPolyline(points);
  const handle: LineHandle = {
    get id() { return obj.id; },
    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    opacity(o) { scene.setStyle(obj.id, { opacity: o }); return handle; },
    // tubeRadius has no effect on the buffered Line — kept for API parity.
    radius(_r) { return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
    dashed(size, gap) { scene.setStyle(obj.id, { dash: { size: size ?? 0.05, gap: gap ?? size ?? 0.05 } }); return handle; },
    pickTag(tag) { scene.update(obj.id, { pickTag: tag }); return handle; },
    pickable(p = true) { scene.update(obj.id, { pickable: p }); return handle; },
  };
  return handle;
}

export function shapeHandle(scene: Scene, obj: SceneObject): ShapeHandle {
  const handle: ShapeHandle = {
    get id() { return obj.id; },
    color(c) { scene.setStyle(obj.id, { color: c }); return handle; },
    opacity(o) { scene.setStyle(obj.id, { opacity: o }); return handle; },
    visible(v = true) { scene.setStyle(obj.id, { visible: v }); return handle; },
    label(l) { scene.setStyle(obj.id, { label: l }); return handle; },
    layer(name) { scene.setStyle(obj.id, { layer: name }); return handle; },
  };
  return handle;
}
