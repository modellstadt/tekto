/**
 * FlatMeshGen — procedural generators for `Mesh` (typed-array flat
 * mesh). The flat-mesh CLASS lives at `src/core/geometry/mesh/Mesh.ts`;
 * this file only holds the generators that haven't been ported into
 * `MeshFactory` yet.
 *
 * Public names in `src/index.ts`:
 *   FlatMeshGen      — generators (here)
 *   FlatMesh, RenderMesh — aliases of the `Mesh` class from `core/geometry/mesh/Mesh`
 */

import { Vec2 } from "../math/vectors";
import { Mesh } from "../geometry/mesh/Mesh";

export const FlatMeshGen = {

  grid(
    width: number,
    depth: number,
    divsX: number,
    divsZ: number,
    heightFn: (x: number, z: number) => number = () => 0,
  ): Mesh & { update(hfn: (x: number, z: number) => number): void } {
    const vx = divsX + 1, vz = divsZ + 1, vc = vx * vz;
    const pos = new Float32Array(vc * 3);
    const nrm = new Float32Array(vc * 3);
    const idx = new Uint32Array(divsX * divsZ * 6);

    let ii = 0;
    for (let iz = 0; iz < divsZ; iz++) {
      for (let ix = 0; ix < divsX; ix++) {
        const a = iz * vx + ix, b = a + 1, c = a + vx, d = c + 1;
        idx[ii++] = a; idx[ii++] = b; idx[ii++] = d;
        idx[ii++] = a; idx[ii++] = d; idx[ii++] = c;
      }
    }

    let vi = 0;
    for (let iz = 0; iz <= divsZ; iz++) {
      for (let ix = 0; ix <= divsX; ix++) {
        const x = (ix / divsX - 0.5) * width;
        const z = (iz / divsZ - 0.5) * depth;
        pos[vi] = x; pos[vi + 1] = heightFn(x, z); pos[vi + 2] = z;
        vi += 3;
      }
    }

    const fm = new Mesh(pos, idx, nrm) as Mesh & {
      update(hfn: (x: number, z: number) => number): void;
    };

    fm.update = function (hfn: (x: number, z: number) => number) {
      let vi = 0;
      for (let iz = 0; iz <= divsZ; iz++) {
        for (let ix = 0; ix <= divsX; ix++) {
          const x = (ix / divsX - 0.5) * width;
          const z = (iz / divsZ - 0.5) * depth;
          pos[vi + 1] = hfn(x, z);
          vi += 3;
        }
      }

      for (let iz = 0; iz <= divsZ; iz++) {
        for (let ix = 0; ix <= divsX; ix++) {
          const i3 = (iz * vx + ix) * 3;
          const il = ix > 0 ? i3 - 3 : i3;
          const ir = ix < divsX ? i3 + 3 : i3;
          const iu = iz > 0 ? i3 - vx * 3 : i3;
          const id = iz < divsZ ? i3 + vx * 3 : i3;
          const dx = pos[ir + 1] - pos[il + 1];
          const dz = pos[id + 1] - pos[iu + 1];
          const len = Math.sqrt(dx * dx + 1 + dz * dz);
          nrm[i3] = -dx / len; nrm[i3 + 1] = 1 / len; nrm[i3 + 2] = -dz / len;
        }
      }
    };

    fm.computeNormals();
    return fm;
  },

  sphere(radius = 1, segments = 24, rings = 16): Mesh {
    const vc = (rings + 1) * (segments + 1);
    const tc = rings * segments * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(tc * 3);

    let vi = 0;
    for (let r = 0; r <= rings; r++) {
      const phi = (r / rings) * Math.PI;
      const sp = Math.sin(phi), cp = Math.cos(phi);
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        pos[vi++] = radius * sp * Math.cos(theta);
        pos[vi++] = radius * cp;
        pos[vi++] = radius * sp * Math.sin(theta);
      }
    }

    let ii = 0;
    const w = segments + 1;
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * w + s, b = a + 1, c = a + w, d = c + 1;
        if (r > 0) { idx[ii++] = a; idx[ii++] = b; idx[ii++] = d; }
        if (r < rings - 1) { idx[ii++] = a; idx[ii++] = d; idx[ii++] = c; }
      }
    }

    return new Mesh(pos, idx.subarray(0, ii));
  },

  box(width = 1, height = 1, depth = 1): Mesh {
    const w = width / 2, h = height / 2, d = depth / 2;

    const pos = new Float32Array([
      -w,-h,-d,  w,-h,-d,  w,h,-d,  -w,h,-d,
      -w,-h,d,  w,-h,d,  w,h,d,  -w,h,d,
      -w,h,-d,  w,h,-d,  w,h,d,  -w,h,d,
      -w,-h,-d,  w,-h,-d,  w,-h,d,  -w,-h,d,
      w,-h,-d,  w,h,-d,  w,h,d,  w,-h,d,
      -w,-h,-d,  -w,h,-d,  -w,h,d,  -w,-h,d,
    ]);

    const idx = new Uint32Array([
      0,1,2, 0,2,3,
      4,6,5, 4,7,6,
      8,9,10, 8,10,11,
      12,14,13, 12,15,14,
      16,17,18, 16,18,19,
      20,22,21, 20,23,22,
    ]);

    return new Mesh(pos, idx);
  },

  torus(majorR = 1, minorR = 0.3, segments = 32, sides = 16): Mesh {
    const vc = (segments + 1) * (sides + 1);
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(segments * sides * 6);

    let vi = 0;
    for (let s = 0; s <= segments; s++) {
      const th = (s / segments) * Math.PI * 2;
      const ct = Math.cos(th), st = Math.sin(th);
      for (let r = 0; r <= sides; r++) {
        const ph = (r / sides) * Math.PI * 2;
        pos[vi++] = (majorR + minorR * Math.cos(ph)) * ct;
        pos[vi++] = minorR * Math.sin(ph);
        pos[vi++] = (majorR + minorR * Math.cos(ph)) * st;
      }
    }

    let ii = 0;
    const w = sides + 1;
    for (let s = 0; s < segments; s++) {
      for (let r = 0; r < sides; r++) {
        const a = s * w + r, b = a + 1, c = a + w, d = c + 1;
        idx[ii++] = a; idx[ii++] = b; idx[ii++] = d;
        idx[ii++] = a; idx[ii++] = d; idx[ii++] = c;
      }
    }

    return new Mesh(pos, idx);
  },

  cylinder(radiusTop = 1, radiusBottom = 1, height = 2, segments = 24): Mesh {
    const h2 = height / 2;
    const sideVerts = (segments + 1) * 2;
    const capVerts = (segments + 1) * 2 + 2;
    const vc = sideVerts + capVerts;
    const sideTris = segments * 2;
    const capTris = segments * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array((sideTris + capTris) * 3);

    let vi = 0, ii = 0, vOff = 0;

    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      pos[vi++] = radiusBottom * c; pos[vi++] = -h2; pos[vi++] = radiusBottom * sn;
      pos[vi++] = radiusTop * c;    pos[vi++] = h2;  pos[vi++] = radiusTop * sn;
    }
    for (let s = 0; s < segments; s++) {
      const a = s * 2, b = a + 1, c = a + 2, d = a + 3;
      idx[ii++] = a; idx[ii++] = c; idx[ii++] = b;
      idx[ii++] = b; idx[ii++] = c; idx[ii++] = d;
    }
    vOff = (segments + 1) * 2;

    const bc = vOff; pos[vi++] = 0; pos[vi++] = -h2; pos[vi++] = 0; vOff++;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      pos[vi++] = radiusBottom * Math.cos(a); pos[vi++] = -h2; pos[vi++] = radiusBottom * Math.sin(a);
    }
    for (let s = 0; s < segments; s++) {
      idx[ii++] = bc; idx[ii++] = vOff + s + 1; idx[ii++] = vOff + s;
    }
    vOff += segments + 1;

    const tc = vOff; pos[vi++] = 0; pos[vi++] = h2; pos[vi++] = 0; vOff++;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      pos[vi++] = radiusTop * Math.cos(a); pos[vi++] = h2; pos[vi++] = radiusTop * Math.sin(a);
    }
    for (let s = 0; s < segments; s++) {
      idx[ii++] = tc; idx[ii++] = vOff + s; idx[ii++] = vOff + s + 1;
    }

    return new Mesh(pos.subarray(0, vi), idx.subarray(0, ii));
  },

  revolve(profile: Vec2[] | { x: number; y: number }[], segments = 32): Mesh {
    const n = profile.length;
    const vc = (segments + 1) * n;
    const tc = segments * (n - 1) * 2;
    const pos = new Float32Array(vc * 3);
    const idx = new Uint32Array(tc * 3);

    let vi = 0;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 0; i < n; i++) {
        const p = profile[i];
        pos[vi++] = p.x * ca; pos[vi++] = p.y; pos[vi++] = p.x * sa;
      }
    }

    let ii = 0;
    for (let s = 0; s < segments; s++) {
      for (let i = 0; i < n - 1; i++) {
        const a = s * n + i, b = a + 1, c = a + n, d = c + 1;
        idx[ii++] = a; idx[ii++] = b; idx[ii++] = d;
        idx[ii++] = a; idx[ii++] = d; idx[ii++] = c;
      }
    }

    return new Mesh(pos, idx);
  },

  subdivide(fm: Mesh): Mesh {
    const pos = fm.positions, idx = fm.indices;
    const vc = fm.vertexCount, tc = fm.triangleCount;

    const edgeMidpoints = new Map<string, number>();
    let newVc = vc;

    for (let t = 0; t < idx.length; t += 3) {
      for (let j = 0; j < 3; j++) {
        const a = idx[t + j], b = idx[t + (j + 1) % 3];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edgeMidpoints.has(key)) {
          edgeMidpoints.set(key, newVc++);
        }
      }
    }

    const newPos = new Float32Array(newVc * 3);
    const newIdx = new Uint32Array(tc * 4 * 3);

    newPos.set(pos);

    for (const [key, mid] of edgeMidpoints) {
      const [as, bs] = key.split(':');
      const a = parseInt(as) * 3, b = parseInt(bs) * 3;
      const o = mid * 3;
      newPos[o] = (pos[a] + pos[b]) * 0.5;
      newPos[o + 1] = (pos[a + 1] + pos[b + 1]) * 0.5;
      newPos[o + 2] = (pos[a + 2] + pos[b + 2]) * 0.5;
    }

    let ii = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const v0 = idx[t], v1 = idx[t + 1], v2 = idx[t + 2];

      const k01 = v0 < v1 ? `${v0}:${v1}` : `${v1}:${v0}`;
      const k12 = v1 < v2 ? `${v1}:${v2}` : `${v2}:${v1}`;
      const k20 = v2 < v0 ? `${v2}:${v0}` : `${v0}:${v2}`;

      const m01 = edgeMidpoints.get(k01)!;
      const m12 = edgeMidpoints.get(k12)!;
      const m20 = edgeMidpoints.get(k20)!;

      newIdx[ii++] = v0;  newIdx[ii++] = m01; newIdx[ii++] = m20;
      newIdx[ii++] = m01; newIdx[ii++] = v1;  newIdx[ii++] = m12;
      newIdx[ii++] = m20; newIdx[ii++] = m12; newIdx[ii++] = v2;
      newIdx[ii++] = m01; newIdx[ii++] = m12; newIdx[ii++] = m20;
    }

    return new Mesh(newPos, newIdx);
  },
};
