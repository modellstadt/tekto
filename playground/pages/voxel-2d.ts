/**
 * Voxel Grid 2D — distance transform, flood fill, blur, blob detection, isovist.
 * Port of HDGEO VoxelGrid2DTestPage.
 */
import {
  sketch, SketchInstance, Vec2,
  VoxelGrid2D, DistanceTransform, FloodFill, BlobDetect, PixelView, Polygon2D,
} from "../../src";
import type { FlatMeshData } from "../../src/scene/Scene";

// ── Color palettes ──

const PALETTE = [
  [0.90, 0.30, 0.30, 1], [0.30, 0.80, 0.40, 1], [0.30, 0.50, 0.90, 1],
  [0.90, 0.80, 0.20, 1], [0.80, 0.30, 0.80, 1], [0.20, 0.80, 0.80, 1],
  [0.90, 0.50, 0.20, 1], [0.50, 0.90, 0.30, 1], [0.40, 0.30, 0.90, 1],
  [0.90, 0.40, 0.60, 1],
];

function heatmap(t: number): [number, number, number, number] {
  t = Math.max(0, Math.min(1, t));
  let r: number, g: number, b: number;
  if (t < 0.25)      { const s = t / 0.25; r = 0; g = s; b = 1; }
  else if (t < 0.5)  { const s = (t - 0.25) / 0.25; r = 0; g = 1; b = 1 - s; }
  else if (t < 0.75) { const s = (t - 0.5) / 0.25; r = s; g = 1; b = 0; }
  else               { const s = (t - 0.75) / 0.25; r = 1; g = 1 - s; b = 0; }
  return [r, g, b, 1];
}

// ── Build colored grid mesh ──

function buildGridMesh(
  grid: VoxelGrid2D,
  colorFn: (val: number, x: number, y: number) => [number, number, number, number],
): FlatMeshData {
  const { nx, ny } = grid;
  const vertCount = nx * ny;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 4);

  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      const vi = x * ny + y;
      const pos = grid.getPosition(x, y);
      positions[vi * 3] = pos.x;
      positions[vi * 3 + 1] = 0;
      positions[vi * 3 + 2] = pos.y; // 2D Y → 3D Z
      normals[vi * 3 + 1] = 1; // Y-up normal
      const c = colorFn(grid.values[vi], x, y);
      colors[vi * 4] = c[0];
      colors[vi * 4 + 1] = c[1];
      colors[vi * 4 + 2] = c[2];
      colors[vi * 4 + 3] = c[3];
    }
  }

  const indexCount = (nx - 1) * (ny - 1) * 6;
  const indices = new Uint32Array(indexCount);
  let ii = 0;
  for (let x = 0; x < nx - 1; x++) {
    for (let y = 0; y < ny - 1; y++) {
      const v00 = x * ny + y;
      const v10 = (x + 1) * ny + y;
      const v11 = (x + 1) * ny + y + 1;
      const v01 = x * ny + y + 1;
      indices[ii++] = v00; indices[ii++] = v10; indices[ii++] = v11;
      indices[ii++] = v00; indices[ii++] = v11; indices[ii++] = v01;
    }
  }

  return { positions, normals, indices, colors };
}

// ── Scenes ──

function distanceTransformScene(resolution: number, seedCount: number, seed: number) {
  const extent = 4;
  const grid = new VoxelGrid2D(resolution, resolution,
    extent * 2 / (resolution - 1), -extent, -extent);
  grid.clear(1e6);

  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  const labels = new Int32Array(grid.values.length);
  for (let i = 0; i < seedCount; i++) {
    const sx = Math.floor(rand() * grid.nx);
    const sy = Math.floor(rand() * grid.ny);
    const idx = sx * grid.ny + sy;
    grid.values[idx] = 0;
    labels[idx] = i + 1;
  }

  DistanceTransform.compute2DWithLabels(grid, labels);

  const { min: rMin, max: rMax } = grid.getRange();
  const range = rMax - rMin || 1;

  return buildGridMesh(grid, (val, x, y) => {
    const label = labels[x * grid.ny + y];
    if (label <= 0) return [0.1, 0.1, 0.1, 1];
    const base = PALETTE[(label - 1) % PALETTE.length];
    const t = Math.max(0.3, 1 - (val - rMin) / range);
    return [base[0] * t, base[1] * t, base[2] * t, 1];
  });
}

function floodFillScene(resolution: number) {
  const extent = 4;
  const grid = new VoxelGrid2D(resolution, resolution,
    extent * 2 / (resolution - 1), -extent, -extent);
  grid.values.fill(1);

  // Circular obstacle
  const radius = extent * 0.5;
  for (let x = 0; x < grid.nx; x++) {
    for (let y = 0; y < grid.ny; y++) {
      const pos = grid.getPosition(x, y);
      if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) < radius)
        grid.values[x * grid.ny + y] = -1;
    }
  }

  // Vertical wall
  const wallX = 1;
  const wallThickness = grid.cellSize * 1.5;
  const circleYAtWall = Math.sqrt(Math.max(0, radius * radius - wallX * wallX));
  for (let x = 0; x < grid.nx; x++) {
    for (let y = 0; y < grid.ny; y++) {
      const pos = grid.getPosition(x, y);
      if (Math.abs(pos.x - wallX) < wallThickness &&
          (pos.y >= circleYAtWall || pos.y <= -circleYAtWall))
        grid.values[x * grid.ny + y] = -2;
    }
  }

  const isObstacle = new Uint8Array(grid.values.length);
  for (let i = 0; i < grid.values.length; i++)
    isObstacle[i] = grid.values[i] < 0 ? 1 : 0;

  FloodFill.fill2D(grid, [{ x: 0, y: 0 }]);

  return buildGridMesh(grid, (val, x, y) => {
    const idx = x * grid.ny + y;
    if (isObstacle[idx]) return [0.15, 0.15, 0.15, 1]; // obstacle
    if (val < 0) return [0.15, 0.45, 0.65, 1]; // reached
    return [0.6, 0.25, 0.2, 1]; // unreached
  });
}

function blurScene(resolution: number, blurRadius: number, seed: number) {
  const extent = 4;
  const grid = new VoxelGrid2D(resolution, resolution,
    extent * 2 / (resolution - 1), -extent, -extent);

  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  const blockSize = Math.max(1, Math.floor(resolution / 8));
  for (let x = 0; x < grid.nx; x++) {
    for (let y = 0; y < grid.ny; y++) {
      const check = (Math.floor(x / blockSize) + Math.floor(y / blockSize)) % 2 === 0;
      const noise = rand() * 0.2 - 0.1;
      grid.values[x * grid.ny + y] = (check ? 1 : 0) + noise;
    }
  }

  if (blurRadius > 0) grid.blur(blurRadius);

  const { min: rMin, max: rMax } = grid.getRange();
  const range = rMax - rMin || 1;

  return buildGridMesh(grid, (val) => {
    const t = (val - rMin) / range;
    return heatmap(t);
  });
}

interface BlobResult {
  meshData: FlatMeshData;
  contours: { x: number; y: number }[][];
  grid: VoxelGrid2D;
  blobCount: number;
}

function blobDetectionScene(resolution: number, circles: number, threshold: number,
                            seed: number): BlobResult {
  const extent = 4;
  const grid = new VoxelGrid2D(resolution, resolution,
    extent * 2 / (resolution - 1), -extent, -extent);
  grid.clear(0);

  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  for (let i = 0; i < circles; i++) {
    const cx = rand() * extent * 1.6 - extent * 0.8;
    const cy = rand() * extent * 1.6 - extent * 0.8;
    const r = 0.3 + rand() * 1.2;
    for (let x = 0; x < grid.nx; x++) {
      for (let y = 0; y < grid.ny; y++) {
        const pos = grid.getPosition(x, y);
        const dx = pos.x - cx, dy = pos.y - cy;
        if (dx * dx + dy * dy < r * r)
          grid.values[x * grid.ny + y] = 1;
      }
    }
  }

  const { labels, blobCount } = BlobDetect.labelComponents2D(grid, threshold);
  const contours = BlobDetect.traceContours2D(grid, threshold);

  const meshData = buildGridMesh(grid, (_val, x, y) => {
    const label = labels[x * grid.ny + y];
    if (label <= 0) return [0.08, 0.08, 0.08, 1];
    return PALETTE[(label - 1) % PALETTE.length] as [number, number, number, number];
  });

  return { meshData, contours, grid, blobCount };
}

function isovistScene(resolution: number, viewX: number, viewY: number): FlatMeshData {
  const extent = 4;
  const obstacles = new VoxelGrid2D(resolution, resolution,
    extent * 2 / (resolution - 1), -extent, -extent);
  obstacles.values.fill(1); // open space

  const nx = obstacles.nx, ny = obstacles.ny;
  const w = obstacles.cellSize * 2; // wall thickness

  // Helper: set rectangular wall region in world coords
  const wall = (wx1: number, wy1: number, wx2: number, wy2: number) => {
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++) {
        const pos = obstacles.getPosition(x, y);
        if (pos.x >= wx1 && pos.x <= wx2 && pos.y >= wy1 && pos.y <= wy2)
          obstacles.values[x * ny + y] = 0;
      }
  };

  // Outer boundary walls
  wall(-extent, -extent, extent, -extent + w);
  wall(-extent, extent - w, extent, extent);
  wall(-extent, -extent, -extent + w, extent);
  wall(extent - w, -extent, extent, extent);

  // Horizontal wall at y=0 with doorway gap at x=1.5..2.5
  wall(-extent, -w / 2, 1.5, w / 2);
  wall(2.5, -w / 2, extent, w / 2);

  // Vertical wall at x=0, from y=0 up to y=3
  wall(-w / 2, 0, w / 2, 3);

  // Vertical wall at x=-2, from bottom to y=-1
  wall(-2 - w / 2, -extent, -2 + w / 2, -1);

  // Small room: box at top-right
  wall(1, 2, 1 + w, extent);
  wall(1, 2, extent, 2 + w);

  // Convert viewpoint to grid coords
  const vCoord = obstacles.getVoxelCoord(new Vec2(viewX, viewY));
  const vx = Math.max(0, Math.min(nx - 1, vCoord.x));
  const vy = Math.max(0, Math.min(ny - 1, vCoord.y));

  const result = new VoxelGrid2D(nx, ny, obstacles.cellSize, -extent, -extent);
  result.clear(0);

  PixelView.analyse(obstacles, result, vx, vy);

  return buildGridMesh(obstacles, (_val, x, y) => {
    // Viewpoint marker
    if (Math.abs(x - vx) <= 1 && Math.abs(y - vy) <= 1)
      return [0.9, 0.15, 0.15, 1]; // red

    const isObs = obstacles.values[x * ny + y] <= 0;
    const vis = result.values[x * ny + y];

    if (isObs) return [0.08, 0.08, 0.08, 1]; // black: wall
    if (vis > 0) return [0.20, 0.75, 0.30, 1]; // green: visible
    return [0.85, 0.85, 0.85, 1]; // light gray: not visible
  });
}

// ── Main ──

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const scene = lab.select("Scene",
      ["Distance Transform", "Flood Fill", "Isovist", "Blur", "Blob Detection"] as const,
      "Distance Transform");
    const resolution = lab.slider("Resolution", 10, 150, 50, { step: 1 });
    const seed = lab.slider("Seed", 0, 1000, 42, { step: 1 });

    let meshData: FlatMeshData;

    if (scene.value === "Distance Transform") {
      const seedCount = lab.slider("Seeds", 2, 20, 8, { step: 1 });
      meshData = distanceTransformScene(resolution.value, seedCount.value, seed.value);
    } else if (scene.value === "Flood Fill") {
      meshData = floodFillScene(resolution.value);
    } else if (scene.value === "Isovist") {
      const vx = lab.slider("View X", -3.5, 3.5, -1);
      const vy = lab.slider("View Y", -3.5, 3.5, -2);
      meshData = isovistScene(resolution.value, vx.value, vy.value);
    } else if (scene.value === "Blur") {
      const blurRadius = lab.slider("Blur Radius", 0, 10, 3, { step: 1 });
      meshData = blurScene(resolution.value, blurRadius.value, seed.value);
    } else {
      const circles = lab.slider("Circles", 1, 30, 12, { step: 1 });
      const threshold = lab.slider("Threshold", -1, 2, 0.5);
      const result = blobDetectionScene(resolution.value, circles.value, threshold.value, seed.value);
      meshData = result.meshData;

      // Draw contour outlines
      for (const contour of result.contours) {
        lab.beginShape("line_strip");
        for (const pt of contour) {
          const pos = result.grid.getPosition(pt.x, pt.y);
          lab.vertex(pos.x, 0.01, pos.y);
        }
        lab.endShape(true)?.color("#ffffff");

        // OBB per contour
        const worldPts = contour.map(pt => result.grid.getPosition(pt.x, pt.y));
        const obb = Polygon2D.minAreaRect(worldPts);
        const corners = obb.corners;
        for (let i = 0; i < 4; i++) {
          const a = corners[i], b = corners[(i + 1) % 4];
          lab.line(a.x, 0.02, a.y, b.x, 0.02, b.y).color("#ffd91a");
        }
      }

      lab.log("Blobs", result.blobCount);
    }

    lab.flatMesh(meshData);

    lab.log("Grid", `${resolution.value} x ${resolution.value}`);
  }, {
    container,
    title: "Voxel Grid 2D",
    background: 0x0a0b14,
    camera: [0, 12, 0],
    target: [0, 0, 0],
  });
}
