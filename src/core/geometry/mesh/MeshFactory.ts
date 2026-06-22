/**
 * Tekto MeshFactory — Factory functions that produce ConnectedMesh instances.
 *
 * Mirrors HDGEO.Core.MeshFactory.
 */

import { Vec2, Vec3 } from "../../math/vectors";
import { ConnectedMesh } from "./ConnectedMesh";
import { CurveUtils } from "../curves";

export const MeshFactory = {

  // ── Parametric Surfaces ──

  grid(
    width: number,
    depth: number,
    divisionsX: number,
    divisionsZ: number,
    heightFn: (x: number, z: number) => number = () => 0
  ): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const ids: number[][] = [];

    for (let iz = 0; iz <= divisionsZ; iz++) {
      ids[iz] = [];
      for (let ix = 0; ix <= divisionsX; ix++) {
        const x = (ix / divisionsX - 0.5) * width;
        const z = (iz / divisionsZ - 0.5) * depth;
        const y = heightFn(x, z);
        ids[iz][ix] = mesh.addNode(new Vec3(x, y, z));
      }
    }

    for (let iz = 0; iz < divisionsZ; iz++) {
      for (let ix = 0; ix < divisionsX; ix++) {
        mesh.addQuad(ids[iz][ix], ids[iz][ix + 1], ids[iz + 1][ix + 1], ids[iz + 1][ix]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  extrude(polygon: Vec3[], direction: Vec3, cap = true): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const n = polygon.length;

    const bottom = polygon.map(p => mesh.addNode(p));
    const top = polygon.map(p => mesh.addNode(p.add(direction)));

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      mesh.addQuad(bottom[i], bottom[next], top[next], top[i]);
    }

    if (cap && n >= 3) {
      mesh.addFace(bottom);
      mesh.addFace([...top].reverse());
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  revolve(profile: Vec2[], segments: number = 32, angleRange = Math.PI * 2): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const n = profile.length;
    const ids: number[][] = [];
    const isClosed = Math.abs(angleRange - Math.PI * 2) < 1e-6;
    const slices = isClosed ? segments : segments + 1;

    for (let s = 0; s < slices; s++) {
      ids[s] = [];
      const angle = (s / segments) * angleRange;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        ids[s][i] = mesh.addNode(new Vec3(p.x * cos, p.y, p.x * sin));
      }
    }

    for (let s = 0; s < segments; s++) {
      const ns = (s + 1) % slices;
      for (let i = 0; i < n - 1; i++) {
        mesh.addQuad(ids[s][i], ids[s][i + 1], ids[ns][i + 1], ids[ns][i]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  loft(profiles: Vec3[][], closedProfile = true): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const ids: number[][] = [];

    for (let p = 0; p < profiles.length; p++) {
      ids[p] = profiles[p].map(pos => mesh.addNode(pos));
    }

    for (let p = 0; p < profiles.length - 1; p++) {
      const currIds = ids[p];
      const nextIds = ids[p + 1];
      const n = Math.min(currIds.length, nextIds.length);
      const limit = closedProfile ? n : n - 1;
      for (let i = 0; i < limit; i++) {
        const ni = (i + 1) % n;
        mesh.addQuad(currIds[i], currIds[ni], nextIds[ni], nextIds[i]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  // ── Primitives ──

  box(width = 1, height = 1, depth = 1): ConnectedMesh {
    const w = width / 2, h = height / 2, d = depth / 2;
    const mesh = new ConnectedMesh();

    const v = [
      mesh.addNode(new Vec3(-w, -h, -d)),
      mesh.addNode(new Vec3( w, -h, -d)),
      mesh.addNode(new Vec3( w,  h, -d)),
      mesh.addNode(new Vec3(-w,  h, -d)),
      mesh.addNode(new Vec3(-w, -h,  d)),
      mesh.addNode(new Vec3( w, -h,  d)),
      mesh.addNode(new Vec3( w,  h,  d)),
      mesh.addNode(new Vec3(-w,  h,  d)),
    ];

    mesh.addQuad(v[0], v[3], v[2], v[1]);
    mesh.addQuad(v[4], v[5], v[6], v[7]);
    mesh.addQuad(v[0], v[1], v[5], v[4]);
    mesh.addQuad(v[2], v[3], v[7], v[6]);
    mesh.addQuad(v[0], v[4], v[7], v[3]);
    mesh.addQuad(v[1], v[2], v[6], v[5]);

    mesh.computeVertexNormals();
    return mesh;
  },

  sphere(radius = 1, segments = 24, rings = 16): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const ids: number[][] = [];

    for (let r = 0; r <= rings; r++) {
      ids[r] = [];
      const phi = (r / rings) * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        ids[r][s] = mesh.addNode(new Vec3(
          radius * sinPhi * Math.cos(theta),
          radius * cosPhi,
          radius * sinPhi * Math.sin(theta)
        ));
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        if (r > 0) {
          mesh.addTriangle(ids[r][s], ids[r][s + 1], ids[r + 1][s + 1]);
        }
        if (r < rings - 1) {
          mesh.addTriangle(ids[r][s], ids[r + 1][s + 1], ids[r + 1][s]);
        }
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  cylinder(radiusTop = 1, radiusBottom = 1, height = 2, segments = 24, cap = true): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const h2 = height / 2;
    const bottomIds: number[] = [];
    const topIds: number[] = [];

    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      bottomIds.push(mesh.addNode(new Vec3(radiusBottom * cos, -h2, radiusBottom * sin)));
      topIds.push(mesh.addNode(new Vec3(radiusTop * cos, h2, radiusTop * sin)));
    }

    for (let s = 0; s < segments; s++) {
      mesh.addQuad(bottomIds[s], bottomIds[s + 1], topIds[s + 1], topIds[s]);
    }

    if (cap) {
      const bottomCenter = mesh.addNode(new Vec3(0, -h2, 0));
      const topCenter = mesh.addNode(new Vec3(0, h2, 0));
      for (let s = 0; s < segments; s++) {
        mesh.addTriangle(bottomCenter, bottomIds[s + 1], bottomIds[s]);
        mesh.addTriangle(topCenter, topIds[s], topIds[s + 1]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  torus(majorRadius = 1, minorRadius = 0.3, segments = 32, sides = 16): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const ids: number[][] = [];

    for (let s = 0; s <= segments; s++) {
      ids[s] = [];
      const theta = (s / segments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      for (let r = 0; r <= sides; r++) {
        const phi = (r / sides) * Math.PI * 2;
        const x = (majorRadius + minorRadius * Math.cos(phi)) * cosT;
        const y = minorRadius * Math.sin(phi);
        const z = (majorRadius + minorRadius * Math.cos(phi)) * sinT;
        ids[s][r] = mesh.addNode(new Vec3(x, y, z));
      }
    }

    for (let s = 0; s < segments; s++) {
      for (let r = 0; r < sides; r++) {
        mesh.addQuad(ids[s][r], ids[s][r + 1], ids[s + 1][r + 1], ids[s + 1][r]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  /**
   * Create a tube mesh by sweeping a circular cross-section along a path.
   * Accepts uniform radius (number) or per-point varying radii (number[]).
   */
  pipe(path: Vec3[], radius: number | number[], sides = 8): ConnectedMesh {
    const mesh = new ConnectedMesh();
    const frames = CurveUtils.parallelTransportFrames(path);
    if (frames.length === 0) return mesh;

    const ids: number[][] = [];

    for (let p = 0; p < path.length; p++) {
      ids[p] = [];
      const r = typeof radius === 'number' ? radius : radius[p];
      const frame = frames[p];
      for (let s = 0; s < sides; s++) {
        const angle = (s / sides) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const offset = frame.normal.mul(cos * r).add(frame.binormal.mul(sin * r));
        ids[p][s] = mesh.addNode(path[p].add(offset));
      }
    }

    for (let p = 0; p < path.length - 1; p++) {
      for (let s = 0; s < sides; s++) {
        const ns = (s + 1) % sides;
        mesh.addQuad(ids[p][s], ids[p][ns], ids[p + 1][ns], ids[p + 1][s]);
      }
    }

    mesh.computeVertexNormals();
    return mesh;
  },

  // ── Mesh Modifiers ──

  subdivide(mesh: ConnectedMesh): ConnectedMesh {
    const result = new ConnectedMesh();
    const facePoints = new Map<number, number>();
    const edgePoints = new Map<number, number>();
    const nodeMap = new Map<number, number>();

    for (const face of mesh.faces()) {
      const positions = face.nodes.map(nid => mesh.node(nid)!.position);
      const centroid = positions.reduce((sum, p) => sum.add(p), Vec3.zero()).div(positions.length);
      facePoints.set(face.id, result.addNode(centroid));
    }

    for (const edge of mesh.edges()) {
      const p0 = mesh.node(edge.nodes[0])!.position;
      const p1 = mesh.node(edge.nodes[1])!.position;
      const mid = p0.lerp(p1, 0.5);

      if (edge.faces.length === 2) {
        const fc0 = mesh.face(edge.faces[0])!.nodes.map(n => mesh.node(n)!.position);
        const fc1 = mesh.face(edge.faces[1])!.nodes.map(n => mesh.node(n)!.position);
        const c0 = fc0.reduce((s, p) => s.add(p), Vec3.zero()).div(fc0.length);
        const c1 = fc1.reduce((s, p) => s.add(p), Vec3.zero()).div(fc1.length);
        const ep = p0.add(p1).add(c0).add(c1).mul(0.25);
        edgePoints.set(edge.id, result.addNode(ep));
      } else {
        edgePoints.set(edge.id, result.addNode(mid));
      }
    }

    for (const node of mesh.nodes()) {
      const n = node.faces.length;
      if (n === 0) {
        nodeMap.set(node.id, result.addNode(node.position));
        continue;
      }

      const F = node.faces
        .map(fid => {
          const fp = facePoints.get(fid)!;
          return result.node(fp)!.position;
        })
        .reduce((s, p) => s.add(p), Vec3.zero())
        .div(n);

      const R = node.edges
        .map(eid => {
          const e = mesh.edge(eid)!;
          const p0 = mesh.node(e.nodes[0])!.position;
          const p1 = mesh.node(e.nodes[1])!.position;
          return p0.lerp(p1, 0.5);
        })
        .reduce((s, p) => s.add(p), Vec3.zero())
        .div(node.edges.length);

      const newPos = F.add(R.mul(2)).add(node.position.mul(n - 3)).div(n);
      nodeMap.set(node.id, result.addNode(mesh.isBoundaryNode(node.id) ? node.position : newPos));
    }

    for (const face of mesh.faces()) {
      const fp = facePoints.get(face.id)!;
      const n = face.nodes.length;
      for (let i = 0; i < n; i++) {
        const curr = face.nodes[i];
        const prevEdge = face.edges[(i + n - 1) % n];
        const currEdge = face.edges[i];
        result.addQuad(
          edgePoints.get(prevEdge)!,
          nodeMap.get(curr)!,
          edgePoints.get(currEdge)!,
          fp
        );
      }
    }

    result.computeVertexNormals();
    return result;
  },

  triangulate(mesh: ConnectedMesh): ConnectedMesh {
    const result = mesh.clone();
    for (const face of [...result.faces()]) {
      if (face.nodes.length <= 3) continue;
      const nodes = face.nodes;
      result.removeFace(face.id);
      for (let i = 1; i < nodes.length - 1; i++) {
        result.addTriangle(nodes[0], nodes[i], nodes[i + 1]);
      }
    }
    result.computeVertexNormals();
    return result;
  },
};

/** Backward-compat alias */
export { MeshFactory as MeshGen };
