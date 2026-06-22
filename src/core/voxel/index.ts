/**
 * Tekto Voxel — 2D/3D scalar grids, marching squares/cubes, flood fill,
 * distance transforms, and blob detection.
 *
 * Mirrors HDGEO.Core.Voxel.
 */

import { Vec2, Vec3 } from "../math/vectors";
import { ConnectedMesh } from "../geometry/mesh/ConnectedMesh";

// ─── Gaussian kernel helper ──────────────────

function gaussianKernel(radius: number): Float32Array {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  const sigma = radius / 3;
  const s2 = 2 * sigma * sigma;
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / s2);
    sum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}

// ═════════════════════════════════════════════
// VoxelGrid2D
// ═════════════════════════════════════════════

export class VoxelGrid2D {
  values: Float32Array;
  nx: number;
  ny: number;
  x1: number;
  y1: number;
  cellSize: number;

  constructor(nx: number, ny: number, cellSize = 1, x1 = 0, y1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.values = new Float32Array(nx * ny);
  }

  static fromBounds(min: Vec2, max: Vec2, cellSize: number): VoxelGrid2D {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    return new VoxelGrid2D(nx, ny, cellSize, min.x - cellSize, min.y - cellSize);
  }

  static fromResolution(min: Vec2, max: Vec2, resolution: number): VoxelGrid2D {
    const cs = Math.max(max.x - min.x, max.y - min.y) / (resolution - 1);
    return VoxelGrid2D.fromBounds(min, max, cs);
  }

  // ── Indexing ──

  getIndex(x: number, y: number): number { return x * this.ny + y; }

  get(x: number, y: number): number {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny) return Infinity;
    return this.values[x * this.ny + y];
  }

  set(x: number, y: number, value: number): void {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny)
      this.values[x * this.ny + y] = value;
  }

  getPosition(x: number, y: number): Vec2 {
    return new Vec2(this.x1 + x * this.cellSize, this.y1 + y * this.cellSize);
  }

  getVoxelCoord(worldPos: Vec2): { x: number; y: number } {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize),
    };
  }

  // ── Fill ──

  fillFromFunction(fn: (pos: Vec2) => number): void {
    for (let x = 0; x < this.nx; x++) {
      const xc = this.x1 + x * this.cellSize;
      for (let y = 0; y < this.ny; y++) {
        const yc = this.y1 + y * this.cellSize;
        this.values[x * this.ny + y] = fn(new Vec2(xc, yc));
      }
    }
  }

  clear(value = Infinity): void { this.values.fill(value); }

  // ── Scalar offset ──

  offset(amount: number): void {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }

  // ── Gaussian blur (separable 2-pass) ──

  blur(radius: number): void {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, values } = this;
    const temp = new Float32Array(values.length);

    // X pass
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cx = x + k - radius;
          if (cx >= 0 && cx < nx) {
            v += values[cx * ny + y] * kernel[k];
            wSum += kernel[k];
          }
        }
        temp[x * ny + y] = v / wSum;
      }
    }

    // Y pass
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        let v = 0, wSum = 0;
        for (let k = 0; k < kSize; k++) {
          const cy = y + k - radius;
          if (cy >= 0 && cy < ny) {
            v += temp[x * ny + cy] * kernel[k];
            wSum += kernel[k];
          }
        }
        values[x * ny + y] = v / wSum;
      }
    }
  }

  // ── Utilities ──

  getRange(): { min: number; max: number } {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }

  clone(): VoxelGrid2D {
    const copy = new VoxelGrid2D(this.nx, this.ny, this.cellSize, this.x1, this.y1);
    copy.values.set(this.values);
    return copy;
  }
}

// ═════════════════════════════════════════════
// VoxelGrid (3D)
// ═════════════════════════════════════════════

export class VoxelGrid {
  values: Float32Array;
  nx: number;
  ny: number;
  nz: number;
  x1: number;
  y1: number;
  z1: number;
  cellSize: number;

  constructor(nx: number, ny: number, nz: number, cellSize = 1,
    x1 = 0, y1 = 0, z1 = 0) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.cellSize = cellSize;
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.values = new Float32Array(nx * ny * nz);
  }

  static fromBounds(min: Vec3, max: Vec3, cellSize: number): VoxelGrid {
    const nx = Math.floor((max.x - min.x) / cellSize) + 2;
    const ny = Math.floor((max.y - min.y) / cellSize) + 2;
    const nz = Math.floor((max.z - min.z) / cellSize) + 2;
    return new VoxelGrid(nx, ny, nz, cellSize,
      min.x - cellSize, min.y - cellSize, min.z - cellSize);
  }

  static fromResolution(min: Vec3, max: Vec3, resolution: number): VoxelGrid {
    const cs = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) / (resolution - 1);
    return VoxelGrid.fromBounds(min, max, cs);
  }

  // ── Indexing ──

  getIndex(x: number, y: number, z: number): number {
    return x * this.ny * this.nz + y * this.nz + z;
  }

  get(x: number, y: number, z: number): number {
    if (x < 0 || x >= this.nx || y < 0 || y >= this.ny || z < 0 || z >= this.nz) return Infinity;
    return this.values[this.getIndex(x, y, z)];
  }

  set(x: number, y: number, z: number, value: number): void {
    if (x >= 0 && x < this.nx && y >= 0 && y < this.ny && z >= 0 && z < this.nz)
      this.values[this.getIndex(x, y, z)] = value;
  }

  getPosition(x: number, y: number, z: number): Vec3 {
    return new Vec3(
      this.x1 + x * this.cellSize,
      this.y1 + y * this.cellSize,
      this.z1 + z * this.cellSize,
    );
  }

  getVoxelCoord(worldPos: Vec3): { x: number; y: number; z: number } {
    return {
      x: Math.round((worldPos.x - this.x1) / this.cellSize),
      y: Math.round((worldPos.y - this.y1) / this.cellSize),
      z: Math.round((worldPos.z - this.z1) / this.cellSize),
    };
  }

  // ── Fill ──

  fillFromSdf(sdf: { distance(p: Vec3): number }): void {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = sdf.distance(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }

  fillFromFunction(fn: (pos: Vec3) => number): void {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          values[x * nyz + y * nz + z] = fn(new Vec3(xc, yc, z1 + z * cellSize));
        }
      }
    }
  }

  clear(value = Infinity): void { this.values.fill(value); }

  // ── Boolean ops (modify in place) ──

  union(sdf: { distance(p: Vec3): number }): void {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.min(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }

  subtract(sdf: { distance(p: Vec3): number }): void {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], -sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }

  intersect(sdf: { distance(p: Vec3): number }): void {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = this;
    const nyz = ny * nz;
    for (let x = 0; x < nx; x++) {
      const xc = x1 + x * cellSize;
      for (let y = 0; y < ny; y++) {
        const yc = y1 + y * cellSize;
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          values[idx] = Math.max(values[idx], sdf.distance(new Vec3(xc, yc, z1 + z * cellSize)));
        }
      }
    }
  }

  // ── Scalar offset ──

  offset(amount: number): void {
    for (let i = 0; i < this.values.length; i++)
      this.values[i] += amount;
  }

  // ── Gaussian blur (separable 3-pass) ──

  blur(radius: number): void {
    if (radius <= 0) return;
    const kernel = gaussianKernel(radius);
    const kSize = kernel.length;
    const { nx, ny, nz, values } = this;
    const nyz = ny * nz;
    const temp = new Float32Array(values.length);

    // X pass
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cx = x + k - radius;
            if (cx >= 0 && cx < nx) {
              v += values[cx * nyz + y * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp[x * nyz + y * nz + z] = v / wSum;
        }

    // Y pass
    const temp2 = new Float32Array(values.length);
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cy = y + k - radius;
            if (cy >= 0 && cy < ny) {
              v += temp[x * nyz + cy * nz + z] * kernel[k];
              wSum += kernel[k];
            }
          }
          temp2[x * nyz + y * nz + z] = v / wSum;
        }

    // Z pass
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          let v = 0, wSum = 0;
          for (let k = 0; k < kSize; k++) {
            const cz = z + k - radius;
            if (cz >= 0 && cz < nz) {
              v += temp2[x * nyz + y * nz + cz] * kernel[k];
              wSum += kernel[k];
            }
          }
          values[x * nyz + y * nz + z] = v / wSum;
        }
  }

  // ── Utilities ──

  getRange(): { min: number; max: number } {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] < min) min = this.values[i];
      if (this.values[i] > max) max = this.values[i];
    }
    return { min, max };
  }

  clone(): VoxelGrid {
    const copy = new VoxelGrid(this.nx, this.ny, this.nz, this.cellSize,
      this.x1, this.y1, this.z1);
    copy.values.set(this.values);
    return copy;
  }
}

// ═════════════════════════════════════════════
// MarchingSquares
// ═════════════════════════════════════════════

export const MarchingSquares = {
  extract(
    values: ArrayLike<number>, nx: number, ny: number,
    iso = 0, cellSize = 1, originX = 0, originY = 0,
  ): { a: Vec2; b: Vec2 }[] {
    const segments: { a: Vec2; b: Vec2 }[] = [];
    const n = new Float32Array(4);

    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        n[0] = values[x * ny + y];
        n[1] = values[(x + 1) * ny + y];
        n[2] = values[(x + 1) * ny + y + 1];
        n[3] = values[x * ny + y + 1];

        let caseNum = 0;
        for (let i = 3; i >= 0; i--) {
          if (n[i] > iso) caseNum++;
          if (i > 0) caseNum <<= 1;
        }

        const x1 = originX + x * cellSize;
        const y1 = originY + y * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;

        const offset = caseNum * 4;
        for (let i = offset; i < offset + 4; i += 2) {
          const e1 = MS_EDGE_TABLE[i];
          const e2 = MS_EDGE_TABLE[i + 1];
          if (e1 < 0 || e2 < 0) break;
          segments.push({
            a: msEdgePoint(e1, n, x1, y1, x2, y2, iso, cellSize),
            b: msEdgePoint(e2, n, x1, y1, x2, y2, iso, cellSize),
          });
        }
      }
    }
    return segments;
  },

  extractFromGrid(grid: VoxelGrid2D, iso = 0): { a: Vec2; b: Vec2 }[] {
    return MarchingSquares.extract(
      grid.values, grid.nx, grid.ny, iso, grid.cellSize, grid.x1, grid.y1,
    );
  },
};

function msInterp(v1: number, v2: number, iso: number): number {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}

function msEdgePoint(
  edge: number, n: Float32Array,
  x1: number, y1: number, x2: number, y2: number,
  iso: number, cellSize: number,
): Vec2 {
  switch (edge) {
    case 0: return new Vec2(x1 + msInterp(n[0], n[1], iso) * cellSize, y1);
    case 1: return new Vec2(x2, y1 + msInterp(n[1], n[2], iso) * cellSize);
    case 2: return new Vec2(x1 + msInterp(n[3], n[2], iso) * cellSize, y2);
    case 3: return new Vec2(x1, y1 + msInterp(n[0], n[3], iso) * cellSize);
    default: return new Vec2(x1, y1);
  }
}

// 16 × 4 edge lookup table
const MS_EDGE_TABLE = new Int8Array([
  -1, -1, -1, -1,
   0,  3, -1, -1,
   1,  0, -1, -1,
   1,  3, -1, -1,
   2,  1, -1, -1,
   0,  1,  2,  3,
   2,  0, -1, -1,
   2,  3, -1, -1,
   3,  2, -1, -1,
   0,  2, -1, -1,
   1,  0,  3,  2,
   1,  2, -1, -1,
   3,  1, -1, -1,
   0,  1, -1, -1,
   3,  0, -1, -1,
  -1, -1, -1, -1,
]);

// ═════════════════════════════════════════════
// MarchingCubes
// ═════════════════════════════════════════════

export const MarchingCubes = {
  extract(grid: VoxelGrid, iso = 0): ConnectedMesh {
    const { nx, ny, nz, x1, y1, z1, cellSize, values } = grid;
    const nyz = ny * nz;
    const n = new Float32Array(8);

    // Collect triangle vertices with inline welding via string keys
    const positions: Vec3[] = [];
    const indices: number[] = [];
    const vertMap = new Map<string, number>();

    function addVertex(vx: number, vy: number, vz: number): number {
      // Quantize to avoid floating-point key collisions
      const qx = Math.round(vx * 1e4);
      const qy = Math.round(vy * 1e4);
      const qz = Math.round(vz * 1e4);
      const key = `${qx},${qy},${qz}`;
      let idx = vertMap.get(key);
      if (idx !== undefined) return idx;
      idx = positions.length;
      positions.push(new Vec3(vx, vy, vz));
      vertMap.set(key, idx);
      return idx;
    }

    for (let x = 0; x < nx - 1; x++) {
      for (let y = 0; y < ny - 1; y++) {
        for (let z = 0; z < nz - 1; z++) {
          const idx = x * nyz + y * nz + z;

          n[0] = values[idx + nz];
          n[1] = values[idx + nyz + nz];
          n[2] = values[idx + nyz];
          n[3] = values[idx];
          n[4] = values[idx + nz + 1];
          n[5] = values[idx + nyz + nz + 1];
          n[6] = values[idx + nyz + 1];
          n[7] = values[idx + 1];

          let caseNum = 0;
          for (let i = 7; i >= 0; i--) {
            if (n[i] > iso) caseNum++;
            if (i > 0) caseNum <<= 1;
          }

          const offset = caseNum * 15;
          for (let i = offset; i < offset + 15; i += 3) {
            if (MC_TRI_TABLE[i] < 0) break;

            for (let j = i; j < i + 3; j++) {
              let vx: number, vy: number, vz: number;
              switch (MC_TRI_TABLE[j]) {
                case 0:  vx = x + mcInterp(n[0], n[1], iso); vy = y + 1; vz = z; break;
                case 1:  vx = x + 1; vy = y + mcInterp(n[2], n[1], iso); vz = z; break;
                case 2:  vx = x + mcInterp(n[3], n[2], iso); vy = y; vz = z; break;
                case 3:  vx = x; vy = y + mcInterp(n[3], n[0], iso); vz = z; break;
                case 4:  vx = x + mcInterp(n[4], n[5], iso); vy = y + 1; vz = z + 1; break;
                case 5:  vx = x + 1; vy = y + mcInterp(n[6], n[5], iso); vz = z + 1; break;
                case 6:  vx = x + mcInterp(n[7], n[6], iso); vy = y; vz = z + 1; break;
                case 7:  vx = x; vy = y + mcInterp(n[7], n[4], iso); vz = z + 1; break;
                case 8:  vx = x; vy = y + 1; vz = z + mcInterp(n[0], n[4], iso); break;
                case 9:  vx = x + 1; vy = y + 1; vz = z + mcInterp(n[1], n[5], iso); break;
                case 10: vx = x; vy = y; vz = z + mcInterp(n[3], n[7], iso); break;
                case 11: vx = x + 1; vy = y; vz = z + mcInterp(n[2], n[6], iso); break;
                default: vx = x; vy = y; vz = z; break;
              }
              indices.push(addVertex(
                x1 + vx * cellSize,
                y1 + vy * cellSize,
                z1 + vz * cellSize,
              ));
            }
          }
        }
      }
    }

    return ConnectedMesh.fromIndexedTriangles(positions, indices);
  },
};

function mcInterp(v1: number, v2: number, iso: number): number {
  const denom = v2 - v1;
  if (Math.abs(denom) < 1e-10) return 0;
  return (iso - v1) / denom;
}

// 256 × 15 triangle lookup table (Paul Bourke / Lorensen & Cline)
const MC_TRI_TABLE = new Int8Array([
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  8,  3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  1,  9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  8,  3,  9,  8,  1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  8,  3,  1,  2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  2, 11,  0,  2,  9, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   2,  8,  3,  2, 11,  8, 11,  9,  8, -1, -1, -1, -1, -1, -1,
   3, 10,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0, 10,  2,  8, 10,  0, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  9,  0,  2,  3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1, 10,  2,  1,  9, 10,  9,  8, 10, -1, -1, -1, -1, -1, -1,
   3, 11,  1, 10, 11,  3, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0, 11,  1,  0,  8, 11,  8, 10, 11, -1, -1, -1, -1, -1, -1,
   3,  9,  0,  3, 10,  9, 10, 11,  9, -1, -1, -1, -1, -1, -1,
   9,  8, 11, 11,  8, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  7,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  3,  0,  7,  3,  4, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  1,  9,  8,  4,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  1,  9,  4,  7,  1,  7,  3,  1, -1, -1, -1, -1, -1, -1,
   1,  2, 11,  8,  4,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  4,  7,  3,  0,  4,  1,  2, 11, -1, -1, -1, -1, -1, -1,
   9,  2, 11,  9,  0,  2,  8,  4,  7, -1, -1, -1, -1, -1, -1,
   2, 11,  9,  2,  9,  7,  2,  7,  3,  7,  9,  4, -1, -1, -1,
   8,  4,  7,  3, 10,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10,  4,  7, 10,  2,  4,  2,  0,  4, -1, -1, -1, -1, -1, -1,
   9,  0,  1,  8,  4,  7,  2,  3, 10, -1, -1, -1, -1, -1, -1,
   4,  7, 10,  9,  4, 10,  9, 10,  2,  9,  2,  1, -1, -1, -1,
   3, 11,  1,  3, 10, 11,  7,  8,  4, -1, -1, -1, -1, -1, -1,
   1, 10, 11,  1,  4, 10,  1,  0,  4,  7, 10,  4, -1, -1, -1,
   4,  7,  8,  9,  0, 10,  9, 10, 11, 10,  0,  3, -1, -1, -1,
   4,  7, 10,  4, 10,  9,  9, 10, 11, -1, -1, -1, -1, -1, -1,
   9,  5,  4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  5,  4,  0,  8,  3, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  5,  4,  1,  5,  0, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   8,  5,  4,  8,  3,  5,  3,  1,  5, -1, -1, -1, -1, -1, -1,
   1,  2, 11,  9,  5,  4, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  0,  8,  1,  2, 11,  4,  9,  5, -1, -1, -1, -1, -1, -1,
   5,  2, 11,  5,  4,  2,  4,  0,  2, -1, -1, -1, -1, -1, -1,
   2, 11,  5,  3,  2,  5,  3,  5,  4,  3,  4,  8, -1, -1, -1,
   9,  5,  4,  2,  3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0, 10,  2,  0,  8, 10,  4,  9,  5, -1, -1, -1, -1, -1, -1,
   0,  5,  4,  0,  1,  5,  2,  3, 10, -1, -1, -1, -1, -1, -1,
   2,  1,  5,  2,  5,  8,  2,  8, 10,  4,  8,  5, -1, -1, -1,
  11,  3, 10, 11,  1,  3,  9,  5,  4, -1, -1, -1, -1, -1, -1,
   4,  9,  5,  0,  8,  1,  8, 11,  1,  8, 10, 11, -1, -1, -1,
   5,  4,  0,  5,  0, 10,  5, 10, 11, 10,  0,  3, -1, -1, -1,
   5,  4,  8,  5,  8, 11, 11,  8, 10, -1, -1, -1, -1, -1, -1,
   9,  7,  8,  5,  7,  9, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  3,  0,  9,  5,  3,  5,  7,  3, -1, -1, -1, -1, -1, -1,
   0,  7,  8,  0,  1,  7,  1,  5,  7, -1, -1, -1, -1, -1, -1,
   1,  5,  3,  3,  5,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  7,  8,  9,  5,  7, 11,  1,  2, -1, -1, -1, -1, -1, -1,
  11,  1,  2,  9,  5,  0,  5,  3,  0,  5,  7,  3, -1, -1, -1,
   8,  0,  2,  8,  2,  5,  8,  5,  7, 11,  5,  2, -1, -1, -1,
   2, 11,  5,  2,  5,  3,  3,  5,  7, -1, -1, -1, -1, -1, -1,
   7,  9,  5,  7,  8,  9,  3, 10,  2, -1, -1, -1, -1, -1, -1,
   9,  5,  7,  9,  7,  2,  9,  2,  0,  2,  7, 10, -1, -1, -1,
   2,  3, 10,  0,  1,  8,  1,  7,  8,  1,  5,  7, -1, -1, -1,
  10,  2,  1, 10,  1,  7,  7,  1,  5, -1, -1, -1, -1, -1, -1,
   9,  5,  8,  8,  5,  7, 11,  1,  3, 11,  3, 10, -1, -1, -1,
   5,  7,  0,  5,  0,  9,  7, 10,  0,  1,  0, 11, 10, 11,  0,
  10, 11,  0, 10,  0,  3, 11,  5,  0,  8,  0,  7,  5,  7,  0,
  10, 11,  5,  7, 10,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11,  6,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  8,  3,  5, 11,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9,  0,  1,  5, 11,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  8,  3,  1,  9,  8,  5, 11,  6, -1, -1, -1, -1, -1, -1,
   1,  6,  5,  2,  6,  1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  6,  5,  1,  2,  6,  3,  0,  8, -1, -1, -1, -1, -1, -1,
   9,  6,  5,  9,  0,  6,  0,  2,  6, -1, -1, -1, -1, -1, -1,
   5,  9,  8,  5,  8,  2,  5,  2,  6,  3,  2,  8, -1, -1, -1,
   2,  3, 10, 11,  6,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10,  0,  8, 10,  2,  0, 11,  6,  5, -1, -1, -1, -1, -1, -1,
   0,  1,  9,  2,  3, 10,  5, 11,  6, -1, -1, -1, -1, -1, -1,
   5, 11,  6,  1,  9,  2,  9, 10,  2,  9,  8, 10, -1, -1, -1,
   6,  3, 10,  6,  5,  3,  5,  1,  3, -1, -1, -1, -1, -1, -1,
   0,  8, 10,  0, 10,  5,  0,  5,  1,  5, 10,  6, -1, -1, -1,
   3, 10,  6,  0,  3,  6,  0,  6,  5,  0,  5,  9, -1, -1, -1,
   6,  5,  9,  6,  9, 10, 10,  9,  8, -1, -1, -1, -1, -1, -1,
   5, 11,  6,  4,  7,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  3,  0,  4,  7,  3,  6,  5, 11, -1, -1, -1, -1, -1, -1,
   1,  9,  0,  5, 11,  6,  8,  4,  7, -1, -1, -1, -1, -1, -1,
  11,  6,  5,  1,  9,  7,  1,  7,  3,  7,  9,  4, -1, -1, -1,
   6,  1,  2,  6,  5,  1,  4,  7,  8, -1, -1, -1, -1, -1, -1,
   1,  2,  5,  5,  2,  6,  3,  0,  4,  3,  4,  7, -1, -1, -1,
   8,  4,  7,  9,  0,  5,  0,  6,  5,  0,  2,  6, -1, -1, -1,
   7,  3,  9,  7,  9,  4,  3,  2,  9,  5,  9,  6,  2,  6,  9,
   3, 10,  2,  7,  8,  4, 11,  6,  5, -1, -1, -1, -1, -1, -1,
   5, 11,  6,  4,  7,  2,  4,  2,  0,  2,  7, 10, -1, -1, -1,
   0,  1,  9,  4,  7,  8,  2,  3, 10,  5, 11,  6, -1, -1, -1,
   9,  2,  1,  9, 10,  2,  9,  4, 10,  7, 10,  4,  5, 11,  6,
   8,  4,  7,  3, 10,  5,  3,  5,  1,  5, 10,  6, -1, -1, -1,
   5,  1, 10,  5, 10,  6,  1,  0, 10,  7, 10,  4,  0,  4, 10,
   0,  5,  9,  0,  6,  5,  0,  3,  6, 10,  6,  3,  8,  4,  7,
   6,  5,  9,  6,  9, 10,  4,  7,  9,  7, 10,  9, -1, -1, -1,
  11,  4,  9,  6,  4, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4, 11,  6,  4,  9, 11,  0,  8,  3, -1, -1, -1, -1, -1, -1,
  11,  0,  1, 11,  6,  0,  6,  4,  0, -1, -1, -1, -1, -1, -1,
   8,  3,  1,  8,  1,  6,  8,  6,  4,  6,  1, 11, -1, -1, -1,
   1,  4,  9,  1,  2,  4,  2,  6,  4, -1, -1, -1, -1, -1, -1,
   3,  0,  8,  1,  2,  9,  2,  4,  9,  2,  6,  4, -1, -1, -1,
   0,  2,  4,  4,  2,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   8,  3,  2,  8,  2,  4,  4,  2,  6, -1, -1, -1, -1, -1, -1,
  11,  4,  9, 11,  6,  4, 10,  2,  3, -1, -1, -1, -1, -1, -1,
   0,  8,  2,  2,  8, 10,  4,  9, 11,  4, 11,  6, -1, -1, -1,
   3, 10,  2,  0,  1,  6,  0,  6,  4,  6,  1, 11, -1, -1, -1,
   6,  4,  1,  6,  1, 11,  4,  8,  1,  2,  1, 10,  8, 10,  1,
   9,  6,  4,  9,  3,  6,  9,  1,  3, 10,  6,  3, -1, -1, -1,
   8, 10,  1,  8,  1,  0, 10,  6,  1,  9,  1,  4,  6,  4,  1,
   3, 10,  6,  3,  6,  0,  0,  6,  4, -1, -1, -1, -1, -1, -1,
   6,  4,  8, 10,  6,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   7, 11,  6,  7,  8, 11,  8,  9, 11, -1, -1, -1, -1, -1, -1,
   0,  7,  3,  0, 11,  7,  0,  9, 11,  6,  7, 11, -1, -1, -1,
  11,  6,  7,  1, 11,  7,  1,  7,  8,  1,  8,  0, -1, -1, -1,
  11,  6,  7, 11,  7,  1,  1,  7,  3, -1, -1, -1, -1, -1, -1,
   1,  2,  6,  1,  6,  8,  1,  8,  9,  8,  6,  7, -1, -1, -1,
   2,  6,  9,  2,  9,  1,  6,  7,  9,  0,  9,  3,  7,  3,  9,
   7,  8,  0,  7,  0,  6,  6,  0,  2, -1, -1, -1, -1, -1, -1,
   7,  3,  2,  6,  7,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   2,  3, 10, 11,  6,  8, 11,  8,  9,  8,  6,  7, -1, -1, -1,
   2,  0,  7,  2,  7, 10,  0,  9,  7,  6,  7, 11,  9, 11,  7,
   1,  8,  0,  1,  7,  8,  1, 11,  7,  6,  7, 11,  2,  3, 10,
  10,  2,  1, 10,  1,  7, 11,  6,  1,  6,  7,  1, -1, -1, -1,
   8,  9,  6,  8,  6,  7,  9,  1,  6, 10,  6,  3,  1,  3,  6,
   0,  9,  1, 10,  6,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   7,  8,  0,  7,  0,  6,  3, 10,  0, 10,  6,  0, -1, -1, -1,
   7, 10,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   7,  6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  0,  8, 10,  7,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  1,  9, 10,  7,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   8,  1,  9,  8,  3,  1, 10,  7,  6, -1, -1, -1, -1, -1, -1,
  11,  1,  2,  6, 10,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  2, 11,  3,  0,  8,  6, 10,  7, -1, -1, -1, -1, -1, -1,
   2,  9,  0,  2, 11,  9,  6, 10,  7, -1, -1, -1, -1, -1, -1,
   6, 10,  7,  2, 11,  3, 11,  8,  3, 11,  9,  8, -1, -1, -1,
   7,  2,  3,  6,  2,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   7,  0,  8,  7,  6,  0,  6,  2,  0, -1, -1, -1, -1, -1, -1,
   2,  7,  6,  2,  3,  7,  0,  1,  9, -1, -1, -1, -1, -1, -1,
   1,  6,  2,  1,  8,  6,  1,  9,  8,  8,  7,  6, -1, -1, -1,
  11,  7,  6, 11,  1,  7,  1,  3,  7, -1, -1, -1, -1, -1, -1,
  11,  7,  6,  1,  7, 11,  1,  8,  7,  1,  0,  8, -1, -1, -1,
   0,  3,  7,  0,  7, 11,  0, 11,  9,  6, 11,  7, -1, -1, -1,
   7,  6, 11,  7, 11,  8,  8, 11,  9, -1, -1, -1, -1, -1, -1,
   6,  8,  4, 10,  8,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  6, 10,  3,  0,  6,  0,  4,  6, -1, -1, -1, -1, -1, -1,
   8,  6, 10,  8,  4,  6,  9,  0,  1, -1, -1, -1, -1, -1, -1,
   9,  4,  6,  9,  6,  3,  9,  3,  1, 10,  3,  6, -1, -1, -1,
   6,  8,  4,  6, 10,  8,  2, 11,  1, -1, -1, -1, -1, -1, -1,
   1,  2, 11,  3,  0, 10,  0,  6, 10,  0,  4,  6, -1, -1, -1,
   4, 10,  8,  4,  6, 10,  0,  2,  9,  2, 11,  9, -1, -1, -1,
  11,  9,  3, 11,  3,  2,  9,  4,  3, 10,  3,  6,  4,  6,  3,
   8,  2,  3,  8,  4,  2,  4,  6,  2, -1, -1, -1, -1, -1, -1,
   0,  4,  2,  4,  6,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  9,  0,  2,  3,  4,  2,  4,  6,  4,  3,  8, -1, -1, -1,
   1,  9,  4,  1,  4,  2,  2,  4,  6, -1, -1, -1, -1, -1, -1,
   8,  1,  3,  8,  6,  1,  8,  4,  6,  6, 11,  1, -1, -1, -1,
  11,  1,  0, 11,  0,  6,  6,  0,  4, -1, -1, -1, -1, -1, -1,
   4,  6,  3,  4,  3,  8,  6, 11,  3,  0,  3,  9, 11,  9,  3,
  11,  9,  4,  6, 11,  4, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  9,  5,  7,  6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  8,  3,  4,  9,  5, 10,  7,  6, -1, -1, -1, -1, -1, -1,
   5,  0,  1,  5,  4,  0,  7,  6, 10, -1, -1, -1, -1, -1, -1,
  10,  7,  6,  8,  3,  4,  3,  5,  4,  3,  1,  5, -1, -1, -1,
   9,  5,  4, 11,  1,  2,  7,  6, 10, -1, -1, -1, -1, -1, -1,
   6, 10,  7,  1,  2, 11,  0,  8,  3,  4,  9,  5, -1, -1, -1,
   7,  6, 10,  5,  4, 11,  4,  2, 11,  4,  0,  2, -1, -1, -1,
   3,  4,  8,  3,  5,  4,  3,  2,  5, 11,  5,  2, 10,  7,  6,
   7,  2,  3,  7,  6,  2,  5,  4,  9, -1, -1, -1, -1, -1, -1,
   9,  5,  4,  0,  8,  6,  0,  6,  2,  6,  8,  7, -1, -1, -1,
   3,  6,  2,  3,  7,  6,  1,  5,  0,  5,  4,  0, -1, -1, -1,
   6,  2,  8,  6,  8,  7,  2,  1,  8,  4,  8,  5,  1,  5,  8,
   9,  5,  4, 11,  1,  6,  1,  7,  6,  1,  3,  7, -1, -1, -1,
   1,  6, 11,  1,  7,  6,  1,  0,  7,  8,  7,  0,  9,  5,  4,
   4,  0, 11,  4, 11,  5,  0,  3, 11,  6, 11,  7,  3,  7, 11,
   7,  6, 11,  7, 11,  8,  5,  4, 11,  4,  8, 11, -1, -1, -1,
   6,  9,  5,  6, 10,  9, 10,  8,  9, -1, -1, -1, -1, -1, -1,
   3,  6, 10,  0,  6,  3,  0,  5,  6,  0,  9,  5, -1, -1, -1,
   0, 10,  8,  0,  5, 10,  0,  1,  5,  5,  6, 10, -1, -1, -1,
   6, 10,  3,  6,  3,  5,  5,  3,  1, -1, -1, -1, -1, -1, -1,
   1,  2, 11,  9,  5, 10,  9, 10,  8, 10,  5,  6, -1, -1, -1,
   0, 10,  3,  0,  6, 10,  0,  9,  6,  5,  6,  9,  1,  2, 11,
  10,  8,  5, 10,  5,  6,  8,  0,  5, 11,  5,  2,  0,  2,  5,
   6, 10,  3,  6,  3,  5,  2, 11,  3, 11,  5,  3, -1, -1, -1,
   5,  8,  9,  5,  2,  8,  5,  6,  2,  3,  8,  2, -1, -1, -1,
   9,  5,  6,  9,  6,  0,  0,  6,  2, -1, -1, -1, -1, -1, -1,
   1,  5,  8,  1,  8,  0,  5,  6,  8,  3,  8,  2,  6,  2,  8,
   1,  5,  6,  2,  1,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  3,  6,  1,  6, 11,  3,  8,  6,  5,  6,  9,  8,  9,  6,
  11,  1,  0, 11,  0,  6,  9,  5,  0,  5,  6,  0, -1, -1, -1,
   0,  3,  8,  5,  6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11,  5,  6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10,  5, 11,  7,  5, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10,  5, 11, 10,  7,  5,  8,  3,  0, -1, -1, -1, -1, -1, -1,
   5, 10,  7,  5, 11, 10,  1,  9,  0, -1, -1, -1, -1, -1, -1,
  11,  7,  5, 11, 10,  7,  9,  8,  1,  8,  3,  1, -1, -1, -1,
  10,  1,  2, 10,  7,  1,  7,  5,  1, -1, -1, -1, -1, -1, -1,
   0,  8,  3,  1,  2,  7,  1,  7,  5,  7,  2, 10, -1, -1, -1,
   9,  7,  5,  9,  2,  7,  9,  0,  2,  2, 10,  7, -1, -1, -1,
   7,  5,  2,  7,  2, 10,  5,  9,  2,  3,  2,  8,  9,  8,  2,
   2,  5, 11,  2,  3,  5,  3,  7,  5, -1, -1, -1, -1, -1, -1,
   8,  2,  0,  8,  5,  2,  8,  7,  5, 11,  2,  5, -1, -1, -1,
   9,  0,  1,  5, 11,  3,  5,  3,  7,  3, 11,  2, -1, -1, -1,
   9,  8,  2,  9,  2,  1,  8,  7,  2, 11,  2,  5,  7,  5,  2,
   1,  3,  5,  3,  7,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  8,  7,  0,  7,  1,  1,  7,  5, -1, -1, -1, -1, -1, -1,
   9,  0,  3,  9,  3,  5,  5,  3,  7, -1, -1, -1, -1, -1, -1,
   9,  8,  7,  5,  9,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   5,  8,  4,  5, 11,  8, 11, 10,  8, -1, -1, -1, -1, -1, -1,
   5,  0,  4,  5, 10,  0,  5, 11, 10, 10,  3,  0, -1, -1, -1,
   0,  1,  9,  8,  4, 11,  8, 11, 10, 11,  4,  5, -1, -1, -1,
  11, 10,  4, 11,  4,  5, 10,  3,  4,  9,  4,  1,  3,  1,  4,
   2,  5,  1,  2,  8,  5,  2, 10,  8,  4,  5,  8, -1, -1, -1,
   0,  4, 10,  0, 10,  3,  4,  5, 10,  2, 10,  1,  5,  1, 10,
   0,  2,  5,  0,  5,  9,  2, 10,  5,  4,  5,  8, 10,  8,  5,
   9,  4,  5,  2, 10,  3, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   2,  5, 11,  3,  5,  2,  3,  4,  5,  3,  8,  4, -1, -1, -1,
   5, 11,  2,  5,  2,  4,  4,  2,  0, -1, -1, -1, -1, -1, -1,
   3, 11,  2,  3,  5, 11,  3,  8,  5,  4,  5,  8,  0,  1,  9,
   5, 11,  2,  5,  2,  4,  1,  9,  2,  9,  4,  2, -1, -1, -1,
   8,  4,  5,  8,  5,  3,  3,  5,  1, -1, -1, -1, -1, -1, -1,
   0,  4,  5,  1,  0,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   8,  4,  5,  8,  5,  3,  9,  0,  5,  0,  3,  5, -1, -1, -1,
   9,  4,  5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4, 10,  7,  4,  9, 10,  9, 11, 10, -1, -1, -1, -1, -1, -1,
   0,  8,  3,  4,  9,  7,  9, 10,  7,  9, 11, 10, -1, -1, -1,
   1, 11, 10,  1, 10,  4,  1,  4,  0,  7,  4, 10, -1, -1, -1,
   3,  1,  4,  3,  4,  8,  1, 11,  4,  7,  4, 10, 11, 10,  4,
   4, 10,  7,  9, 10,  4,  9,  2, 10,  9,  1,  2, -1, -1, -1,
   9,  7,  4,  9, 10,  7,  9,  1, 10,  2, 10,  1,  0,  8,  3,
  10,  7,  4, 10,  4,  2,  2,  4,  0, -1, -1, -1, -1, -1, -1,
  10,  7,  4, 10,  4,  2,  8,  3,  4,  3,  2,  4, -1, -1, -1,
   2,  9, 11,  2,  7,  9,  2,  3,  7,  7,  4,  9, -1, -1, -1,
   9, 11,  7,  9,  7,  4, 11,  2,  7,  8,  7,  0,  2,  0,  7,
   3,  7, 11,  3, 11,  2,  7,  4, 11,  1, 11,  0,  4,  0, 11,
   1, 11,  2,  8,  7,  4, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  9,  1,  4,  1,  7,  7,  1,  3, -1, -1, -1, -1, -1, -1,
   4,  9,  1,  4,  1,  7,  0,  8,  1,  8,  7,  1, -1, -1, -1,
   4,  0,  3,  7,  4,  3, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   4,  8,  7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   9, 11,  8, 11, 10,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  0,  9,  3,  9, 10, 10,  9, 11, -1, -1, -1, -1, -1, -1,
   0,  1, 11,  0, 11,  8,  8, 11, 10, -1, -1, -1, -1, -1, -1,
   3,  1, 11, 10,  3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  2, 10,  1, 10,  9,  9, 10,  8, -1, -1, -1, -1, -1, -1,
   3,  0,  9,  3,  9, 10,  1,  2,  9,  2, 10,  9, -1, -1, -1,
   0,  2, 10,  8,  0, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   3,  2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   2,  3,  8,  2,  8, 11, 11,  8,  9, -1, -1, -1, -1, -1, -1,
   9, 11,  2,  0,  9,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   2,  3,  8,  2,  8, 11,  0,  1,  8,  1, 11,  8, -1, -1, -1,
   1, 11,  2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   1,  3,  8,  9,  1,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  9,  1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
   0,  3,  8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
]);

// ═════════════════════════════════════════════
// FloodFill
// ═════════════════════════════════════════════

function matchesSign(value: number, targetSign: number): boolean {
  return targetSign > 0 ? value > 0 : value < 0;
}

export const FloodFill = {
  fill2D(grid: VoxelGrid2D, seeds: { x: number; y: number }[], targetSign = 1): void {
    const { values, nx, ny } = grid;
    const visited = new Uint8Array(values.length);
    const queue: number[] = [];

    for (const { x: sx, y: sy } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny) continue;
      const idx = sx * ny + sy;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }

    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];

    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / ny);
      const y = idx % ny;

      for (let d = 0; d < 4; d++) {
        const nx2 = x + dx[d], ny2 = y + dy[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny) continue;
        const nIdx = nx2 * ny + ny2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  },

  fill3D(grid: VoxelGrid, seeds: { x: number; y: number; z: number }[], targetSign = 1): void {
    const { values, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const visited = new Uint8Array(values.length);
    const queue: number[] = [];

    for (const { x: sx, y: sy, z: sz } of seeds) {
      if (sx < 0 || sx >= nx || sy < 0 || sy >= ny || sz < 0 || sz >= nz) continue;
      const idx = sx * nyz + sy * nz + sz;
      if (visited[idx]) continue;
      if (!matchesSign(values[idx], targetSign)) continue;
      visited[idx] = 1;
      values[idx] = -values[idx];
      queue.push(idx);
    }

    const ddx = [-1, 1, 0, 0, 0, 0];
    const ddy = [0, 0, -1, 1, 0, 0];
    const ddz = [0, 0, 0, 0, -1, 1];

    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = Math.floor(idx / nyz);
      const rem = idx % nyz;
      const y = Math.floor(rem / nz);
      const z = rem % nz;

      for (let d = 0; d < 6; d++) {
        const nx2 = x + ddx[d], ny2 = y + ddy[d], nz2 = z + ddz[d];
        if (nx2 < 0 || nx2 >= nx || ny2 < 0 || ny2 >= ny || nz2 < 0 || nz2 >= nz) continue;
        const nIdx = nx2 * nyz + ny2 * nz + nz2;
        if (visited[nIdx]) continue;
        if (!matchesSign(values[nIdx], targetSign)) continue;
        visited[nIdx] = 1;
        values[nIdx] = -values[nIdx];
        queue.push(nIdx);
      }
    }
  },
};

// ═════════════════════════════════════════════
// DistanceTransform
// ═════════════════════════════════════════════

export const DistanceTransform = {
  compute2D(grid: VoxelGrid2D, d1 = 1, d2 = 1.414): void {
    const { values: v, nx, ny } = grid;

    // Forward sweep: top-left to bottom-right
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x > 0) { const c = v[(x - 1) * ny + y] + d1; if (c < cur) cur = c; }
        if (y > 0) { const c = v[idx - 1] + d1; if (c < cur) cur = c; }
        if (x > 0 && y > 0) { const c = v[(x - 1) * ny + y - 1] + d2; if (c < cur) cur = c; }
        if (x < nx - 1 && y > 0) { const c = v[(x + 1) * ny + y - 1] + d2; if (c < cur) cur = c; }
        v[idx] = cur;
      }
    }

    // Backward sweep: bottom-right to top-left
    for (let x = nx - 1; x >= 0; x--) {
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        let cur = v[idx];
        if (cur === 0) continue;
        if (x < nx - 1) { const c = v[(x + 1) * ny + y] + d1; if (c < cur) cur = c; }
        if (y < ny - 1) { const c = v[idx + 1] + d1; if (c < cur) cur = c; }
        if (x < nx - 1 && y < ny - 1) { const c = v[(x + 1) * ny + y + 1] + d2; if (c < cur) cur = c; }
        if (x > 0 && y < ny - 1) { const c = v[(x - 1) * ny + y + 1] + d2; if (c < cur) cur = c; }
        v[idx] = cur;
      }
    }
  },

  compute2DWithLabels(grid: VoxelGrid2D, labels: Int32Array, d1 = 1, d2 = 1.414): void {
    const { values: v, nx, ny } = grid;

    function tryUpdate(idx: number, nIdx: number, cost: number, valid: boolean, cur: { v: number }): void {
      if (!valid) return;
      const c = v[nIdx] + cost;
      if (c < cur.v) { cur.v = c; labels[idx] = labels[nIdx]; }
    }

    // Forward
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x - 1) * ny + y, d1, x > 0, cur);
        tryUpdate(idx, idx - 1, d1, y > 0, cur);
        tryUpdate(idx, (x - 1) * ny + y - 1, d2, x > 0 && y > 0, cur);
        tryUpdate(idx, (x + 1) * ny + y - 1, d2, x < nx - 1 && y > 0, cur);
        v[idx] = cur.v;
      }

    // Backward
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--) {
        const idx = x * ny + y;
        if (v[idx] === 0) continue;
        const cur = { v: v[idx] };
        tryUpdate(idx, (x + 1) * ny + y, d1, x < nx - 1, cur);
        tryUpdate(idx, idx + 1, d1, y < ny - 1, cur);
        tryUpdate(idx, (x + 1) * ny + y + 1, d2, x < nx - 1 && y < ny - 1, cur);
        tryUpdate(idx, (x - 1) * ny + y + 1, d2, x > 0 && y < ny - 1, cur);
        v[idx] = cur.v;
      }
  },

  compute3D(grid: VoxelGrid, d1 = 1, d2 = 1.414, d3 = 1.732): void {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];

    // Forward sweep
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }

    // Backward sweep
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const c = v[nx2 * nyz + ny2 * nz + nz2] + costs[ci];
              if (c < cur) cur = c;
            }
          }
          v[idx] = cur;
        }
  },

  compute3DWithLabels(grid: VoxelGrid, labels: Int32Array, d1 = 1, d2 = 1.414, d3 = 1.732): void {
    const { values: v, nx, ny, nz } = grid;
    const nyz = ny * nz;
    const costs = [d1, d2, d3];

    // Forward
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of FORWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) { cur = c; labels[idx] = labels[nIdx]; }
            }
          }
          v[idx] = cur;
        }

    // Backward
    for (let x = nx - 1; x >= 0; x--)
      for (let y = ny - 1; y >= 0; y--)
        for (let z = nz - 1; z >= 0; z--) {
          const idx = x * nyz + y * nz + z;
          let cur = v[idx];
          if (cur === 0) continue;
          for (const [dx, dy, dz, ci] of BACKWARD_3D) {
            const nx2 = x + dx, ny2 = y + dy, nz2 = z + dz;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny && nz2 >= 0 && nz2 < nz) {
              const nIdx = nx2 * nyz + ny2 * nz + nz2;
              const c = v[nIdx] + costs[ci];
              if (c < cur) { cur = c; labels[idx] = labels[nIdx]; }
            }
          }
          v[idx] = cur;
        }
  },
};

// 13 forward neighbors (face=0, edge=1, corner=2)
const FORWARD_3D: [number, number, number, number][] = [
  [-1,  0,  0, 0], [ 0, -1,  0, 0], [ 0,  0, -1, 0],
  [-1, -1,  0, 1], [-1,  1,  0, 1], [-1,  0, -1, 1],
  [-1,  0,  1, 1], [ 0, -1, -1, 1], [ 0, -1,  1, 1],
  [-1, -1, -1, 2], [-1, -1,  1, 2], [-1,  1, -1, 2],
  [-1,  1,  1, 2],
];

const BACKWARD_3D: [number, number, number, number][] = [
  [ 1,  0,  0, 0], [ 0,  1,  0, 0], [ 0,  0,  1, 0],
  [ 1,  1,  0, 1], [ 1, -1,  0, 1], [ 1,  0,  1, 1],
  [ 1,  0, -1, 1], [ 0,  1,  1, 1], [ 0,  1, -1, 1],
  [ 1,  1,  1, 2], [ 1,  1, -1, 2], [ 1, -1,  1, 2],
  [ 1, -1, -1, 2],
];

// ═════════════════════════════════════════════
// BlobDetect
// ═════════════════════════════════════════════

export const BlobDetect = {
  labelComponents2D(grid: VoxelGrid2D, threshold = 0): { labels: Int32Array; blobCount: number } {
    const { values: v, nx, ny } = grid;
    const labels = new Int32Array(v.length);
    let blobCount = 0;
    const queue: number[] = [];

    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        if (labels[idx] !== 0) continue;
        if (v[idx] <= threshold) continue;

        blobCount++;
        labels[idx] = blobCount;
        queue.length = 0;
        queue.push(idx);
        let head = 0;

        while (head < queue.length) {
          const ci = queue[head++];
          const cx = Math.floor(ci / ny);
          const cy = ci % ny;

          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
            const bx = cx + dx, by = cy + dy;
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            const nIdx = bx * ny + by;
            if (labels[nIdx] !== 0) continue;
            if (v[nIdx] <= threshold) continue;
            labels[nIdx] = blobCount;
            queue.push(nIdx);
          }
        }
      }
    }

    return { labels, blobCount };
  },

  traceContours2D(grid: VoxelGrid2D, threshold = 0): { x: number; y: number }[][] {
    const { values: v, nx, ny } = grid;

    // 8-connected directions: E, SE, S, SW, W, NW, N, NE
    const DX = [1, 1, 0, -1, -1, -1, 0, 1];
    const DY = [0, -1, -1, -1, 0, 1, 1, 1];

    // Pre-compute foreground and border
    const fg = new Uint8Array(v.length);
    const border = new Uint8Array(v.length);

    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const idx = x * ny + y;
        fg[idx] = v[idx] > threshold ? 1 : 0;
        if (!fg[idx]) continue;

        if (x === 0 || x === nx - 1 || y === 0 || y === ny - 1) {
          border[idx] = 1;
          continue;
        }

        for (let d = 0; d < 8; d += 2) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || v[bx * ny + by] <= threshold) {
            border[idx] = 1;
            break;
          }
        }
      }

    const visited = new Uint8Array(v.length);
    const contours: { x: number; y: number }[][] = [];

    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const startIdx = x * ny + y;
        if (!border[startIdx] || visited[startIdx]) continue;

        // Find initial direction pointing toward background
        let startDir = -1;
        for (let d = 0; d < 8; d++) {
          const bx = x + DX[d], by = y + DY[d];
          if (bx < 0 || bx >= nx || by < 0 || by >= ny || !fg[bx * ny + by]) {
            startDir = d;
            break;
          }
        }
        if (startDir === -1) continue;

        const contour: { x: number; y: number }[] = [];
        let cx = x, cy = y;
        let lastDir = (startDir + 4) % 8;

        do {
          const searchStart = ((lastDir + 4) % 8 + 1) % 8;
          let nextDir = -1;
          for (let i = 0; i < 8; i++) {
            const d = (searchStart + i) % 8;
            const bx = cx + DX[d], by = cy + DY[d];
            if (bx < 0 || bx >= nx || by < 0 || by >= ny) continue;
            if (border[bx * ny + by]) { nextDir = d; break; }
          }
          if (nextDir === -1) break;

          const nextX = cx + DX[nextDir], nextY = cy + DY[nextDir];
          const nextIdx = nextX * ny + nextY;

          if (!visited[nextIdx]) {
            visited[nextIdx] = 1;
            contour.push({ x: nextX, y: nextY });
          }

          cx = nextX;
          cy = nextY;
          lastDir = nextDir;
        } while (cx !== x || cy !== y);

        if (contour.length >= 3) contours.push(contour);
      }

    return contours;
  },
};

// ================================================================
// 7. PIXEL VIEW — Discrete 2D shadow-casting visibility (isovist)
// ================================================================

/**
 * Discrete 2D shadow-casting visibility analysis (isovist).
 * For each viewpoint, casts in 4 cardinal directions using Bresenham line-steppers
 * as visibility cone boundaries. Obstacles split the cone, creating shadows.
 *
 * Mirrors HDGEO.Core.Voxel.PixelView.
 */
export const PixelView = {
  /**
   * Computes visibility from a single viewpoint, incrementing the result grid
   * for each visible cell (both open and obstacle cells).
   * @param obstacles Grid where values <= 0 are obstacles, > 0 are open.
   * @param result Grid to increment for each visible cell (same dimensions).
   * @param x Viewpoint X (grid coords).
   * @param y Viewpoint Y (grid coords).
   */
  analyse(obstacles: VoxelGrid2D, result: VoxelGrid2D, x: number, y: number): void {
    stepView(obstacles, result, x, y, 1, 0);
    stepView(obstacles, result, x, y, -1, 0);
    stepView(obstacles, result, x, y, 0, 1);
    stepView(obstacles, result, x, y, 0, -1);
  },

  /**
   * Computes visibility from every non-obstacle cell, accumulating total visibility
   * counts. Result cells with higher values are visible from more viewpoints.
   */
  analyseAll(obstacles: VoxelGrid2D, result: VoxelGrid2D): void {
    for (let x = 0; x < obstacles.nx; x++)
      for (let y = 0; y < obstacles.ny; y++)
        if (!isObstacle(obstacles, x, y))
          PixelView.analyse(obstacles, result, x, y);
  },
};

// ── PixelView internals ──

function isObstacle(obstacles: VoxelGrid2D, x: number, y: number): boolean {
  if (x < 0 || x >= obstacles.nx || y < 0 || y >= obstacles.ny) return true;
  return obstacles.values[x * obstacles.ny + y] <= 0;
}

function inBounds(x: number, y: number, nx: number, ny: number): boolean {
  return x >= 0 && x < nx && y >= 0 && y < ny;
}

/** Bresenham integer line-stepper for visibility cone boundaries. */
class ViewEvent {
  x: number;
  y: number;
  private stepPX: number;
  private stepPY: number;
  private stepDX: number;
  private stepDY: number;
  private dFast: number;
  private dSlow: number;
  private error: number;

  constructor(startX: number, startY: number, endX: number, endY: number) {
    const dX = endX - startX;
    const dY = endY - startY;
    const adX = Math.abs(dX);
    const adY = Math.abs(dY);
    this.stepDX = Math.sign(dX);
    this.stepDY = Math.sign(dY);

    if (adX > adY) {
      this.stepPX = this.stepDX;
      this.stepPY = 0;
      this.dFast = adY;
      this.dSlow = adX;
    } else {
      this.stepPX = 0;
      this.stepPY = this.stepDY;
      this.dFast = adX;
      this.dSlow = adY;
    }

    this.x = startX;
    this.y = startY;
    this.error = this.dSlow / 2;
  }

  stepForward(): void {
    this.error -= this.dFast;
    if (this.error < 0) {
      this.error += this.dSlow;
      this.x += this.stepDX;
      this.y += this.stepDY;
    } else {
      this.x += this.stepPX;
      this.y += this.stepPY;
    }
  }

  clone(): ViewEvent {
    const ev = Object.create(ViewEvent.prototype) as ViewEvent;
    Object.assign(ev, this);
    return ev;
  }
}

function stepView(
  obstacles: VoxelGrid2D, result: VoxelGrid2D,
  x: number, y: number, stepX: number, stepY: number,
): void {
  const nx = obstacles.nx, ny = obstacles.ny;
  const maxDepth = Math.max(nx, ny);
  let plusX: number, plusY: number;
  let events: ViewEvent[] = [];
  let nextEvents: ViewEvent[] = [];

  if (stepX !== 0) {
    events.push(new ViewEvent(x, y, x + stepX, y - 1));
    events.push(new ViewEvent(x, y + 1, x + stepX, y + 2));
    plusX = 0;
    plusY = 1;
  } else {
    events.push(new ViewEvent(x, y, x - 1, y + stepY));
    events.push(new ViewEvent(x + 1, y, x + 2, y + stepY));
    plusX = 1;
    plusY = 0;
  }

  for (let depth = 0; depth < maxDepth && events.length > 0; depth++) {
    nextEvents.length = 0;

    // Advance all events one step deeper
    for (const ev of events) ev.stepForward();

    // Process each pair of events (defining a visible range)
    for (let i = 0; i + 1 < events.length; i += 2) {
      const cEvent0 = events[i];
      const cEvent1 = events[i + 1];

      // Compute scan length; skip if events collapsed or crossed
      const scanSteps = plusY !== 0
        ? cEvent1.y - cEvent0.y
        : cEvent1.x - cEvent0.x;

      if (scanSteps <= 0) continue;

      // Check if entire scan row is out of bounds
      if (plusX === 0 && (cEvent0.x < 0 || cEvent0.x >= nx)) continue;
      if (plusY === 0 && (cEvent0.y < 0 || cEvent0.y >= ny)) continue;

      // Scan perpendicular between the two events
      let cX = cEvent0.x;
      let cY = cEvent0.y;
      let isOpen = !isObstacle(obstacles, cX, cY);
      let openStart = cEvent0.clone();

      // Mark first cell visible
      if (inBounds(cX, cY, nx, ny))
        result.values[cX * ny + cY] += 1;

      cX += plusX;
      cY += plusY;

      for (let s = 1; s < scanSteps; s++) {
        const isObs = isObstacle(obstacles, cX, cY);

        // Mark visible
        if (inBounds(cX, cY, nx, ny))
          result.values[cX * ny + cY] += 1;

        if (isOpen && isObs) {
          // Open → obstacle: close the open segment, propagate forward
          nextEvents.push(openStart);
          nextEvents.push(new ViewEvent(cX, cY, cX + cX - x, cY + cY - y));
          isOpen = false;
        } else if (!isOpen && !isObs) {
          // Obstacle → open: start a new open segment
          openStart = new ViewEvent(cX, cY, cX + cX - x, cY + cY - y);
          isOpen = true;
        }

        cX += plusX;
        cY += plusY;
      }

      // Close any remaining open segment
      if (isOpen) {
        nextEvents.push(openStart);
        nextEvents.push(cEvent1);
      }
    }

    [events, nextEvents] = [nextEvents, events];
  }
}
