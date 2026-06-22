/**
 * Tekto Graph — Weighted graph with Dijkstra, components, flood fill.
 *
 * Mirrors HDGEO.Core.Graph + GridGraph.
 */

// ─── Simple min-heap priority queue ──────────

class MinHeap<T> {
  private data: { val: T; pri: number }[] = [];

  get size(): number { return this.data.length; }

  push(val: T, priority: number): void {
    this.data.push({ val, pri: priority });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0].val;
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[i].pri >= this.data[p].pri) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].pri < this.data[min].pri) min = l;
      if (r < n && this.data[r].pri < this.data[min].pri) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
}

// ─── Graph ───────────────────────────────────

export class Graph {
  getNeighbors: (node: number) => number[];
  getWeight: (a: number, b: number) => number;
  nodeCount: number;

  constructor(
    nodeCount: number,
    getNeighbors: (node: number) => number[],
    getWeight?: (a: number, b: number) => number
  ) {
    this.nodeCount = nodeCount;
    this.getNeighbors = getNeighbors;
    this.getWeight = getWeight ?? (() => 1);
  }

  // ── Dijkstra ──

  dijkstra(source: number): { dist: Float64Array; pred: Int32Array } {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    dist[source] = 0;
    return this.dijkstraFromDistances(dist);
  }

  dijkstraFromSources(sources: number[]): { dist: Float64Array; pred: Int32Array } {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    for (const s of sources) dist[s] = 0;
    return this.dijkstraFromDistances(dist);
  }

  dijkstraFromDistances(startDist: Float64Array): { dist: Float64Array; pred: Int32Array } {
    const dist = new Float64Array(startDist);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap<number>();

    for (let i = 0; i < this.nodeCount; i++) {
      if (dist[i] < Infinity) pq.push(i, dist[i]);
    }

    while (pq.size > 0) {
      const u = pq.pop()!;
      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          pq.push(v, d);
        }
      }
    }

    return { dist, pred };
  }

  shortestPath(source: number, target: number): number[] {
    const { pred } = this.dijkstra(source);
    return Graph.tracePath(pred, target);
  }

  static tracePath(pred: Int32Array, target: number): number[] {
    const path: number[] = [];
    let v = target;
    while (v !== -1) { path.push(v); v = pred[v]; }
    return path;
  }

  // ── Voronoi ──

  dijkstraVoronoi(sources: number[]): { dist: Float64Array; pred: Int32Array; closest: Int32Array } {
    const dist = new Float64Array(this.nodeCount).fill(Infinity);
    const pred = new Int32Array(this.nodeCount).fill(-1);
    const closest = new Int32Array(this.nodeCount).fill(-1);
    const pq = new MinHeap<{ node: number; origin: number }>();

    for (const s of sources) {
      dist[s] = 0;
      closest[s] = s;
      pq.push({ node: s, origin: s }, 0);
    }

    while (pq.size > 0) {
      const { node: u, origin } = pq.pop()!;
      if (closest[u] !== -1 && closest[u] !== origin && dist[u] < Infinity) continue;

      for (const v of this.getNeighbors(u)) {
        const d = dist[u] + this.getWeight(u, v);
        if (d < dist[v]) {
          dist[v] = d;
          pred[v] = u;
          closest[v] = origin;
          pq.push({ node: v, origin }, d);
        }
      }
    }

    return { dist, pred, closest };
  }

  // ── Connected components ──

  connectedComponents(): number[][] {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    const components: number[][] = [];

    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const gid = components.length;
      const component: number[] = [];
      components.push(component);
      const queue: number[] = [i];
      labels[i] = gid;
      component.push(i);

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            component.push(nb);
            queue.push(nb);
          }
        }
      }
    }
    return components;
  }

  componentLabels(): Int32Array {
    const labels = new Int32Array(this.nodeCount).fill(-1);
    let gid = 0;
    for (let i = 0; i < this.nodeCount; i++) {
      if (labels[i] >= 0) continue;
      const queue: number[] = [i];
      labels[i] = gid;
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const nb of this.getNeighbors(current)) {
          if (labels[nb] < 0) {
            labels[nb] = gid;
            queue.push(nb);
          }
        }
      }
      gid++;
    }
    return labels;
  }

  // ── Flood fill ──

  floodFill(seeds: number[], maxDistance = Infinity): number[] {
    const { dist } = this.dijkstraFromSources(seeds);
    const result: number[] = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (dist[i] <= maxDistance) result.push(i);
    return result;
  }

  floodFillPredicate(seed: number, predicate: (node: number) => boolean): number[] {
    const visited = new Uint8Array(this.nodeCount);
    const result: number[] = [];
    const queue: number[] = [];

    if (!predicate(seed)) return result;
    visited[seed] = 1;
    queue.push(seed);
    result.push(seed);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const nb of this.getNeighbors(current)) {
        if (!visited[nb] && predicate(nb)) {
          visited[nb] = 1;
          result.push(nb);
          queue.push(nb);
        }
      }
    }
    return result;
  }

  // ── Degree analysis ──

  degrees(): Int32Array {
    const deg = new Int32Array(this.nodeCount);
    for (let i = 0; i < this.nodeCount; i++)
      deg[i] = this.getNeighbors(i).length;
    return deg;
  }

  leafNodes(): number[] {
    const leaves: number[] = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length === 1) leaves.push(i);
    return leaves;
  }

  junctionNodes(): number[] {
    const junctions: number[] = [];
    for (let i = 0; i < this.nodeCount; i++)
      if (this.getNeighbors(i).length >= 3) junctions.push(i);
    return junctions;
  }

  // ── Eccentricity / Diameter ──

  eccentricity(node: number): number {
    const { dist } = this.dijkstra(node);
    let max = 0;
    for (let i = 0; i < dist.length; i++)
      if (dist[i] < Infinity && dist[i] > max) max = dist[i];
    return max;
  }

  diameter(): number {
    let max = 0;
    for (let i = 0; i < this.nodeCount; i++)
      max = Math.max(max, this.eccentricity(i));
    return max;
  }

  // ── Factories ──

  static fromAdjacencyList(adjacency: number[][], weightFn?: (a: number, b: number) => number): Graph {
    return new Graph(adjacency.length, i => adjacency[i], weightFn);
  }

  static fromEdgeList(
    nodeCount: number,
    edges: [number, number][],
    undirected = true,
    weightFn?: (a: number, b: number) => number
  ): Graph {
    const adj: number[][] = Array.from({ length: nodeCount }, () => []);
    for (const [from, to] of edges) {
      adj[from].push(to);
      if (undirected) adj[to].push(from);
    }
    return new Graph(nodeCount, i => adj[i], weightFn);
  }
}

// ─── GridGraph ───────────────────────────────

export const GridGraph = {
  /** Creates a 2D 4-connected grid graph (N/S/E/W neighbors). */
  grid2D4(nx: number, ny: number, weightFn?: (a: number, b: number) => number): Graph {
    const n = nx * ny;
    const nbs: number[][] = new Array(n);
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list: number[] = [];
        if (x < nx - 1) list.push((x + 1) * ny + y);
        if (y < ny - 1) list.push(x * ny + y + 1);
        if (x > 0) list.push((x - 1) * ny + y);
        if (y > 0) list.push(x * ny + y - 1);
        nbs[x * ny + y] = list;
      }
    }
    return new Graph(n, i => nbs[i], weightFn ?? (() => 1));
  },

  /** Creates a 2D 8-connected grid graph (includes diagonals). */
  grid2D8(nx: number, ny: number, weightFn?: (a: number, b: number) => number): Graph {
    const n = nx * ny;
    const nbs: number[][] = new Array(n);
    const sqrt2 = Math.SQRT2;

    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const list: number[] = [];
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx2 = x + dx, ny2 = y + dy;
            if (nx2 >= 0 && nx2 < nx && ny2 >= 0 && ny2 < ny)
              list.push(nx2 * ny + ny2);
          }
        nbs[x * ny + y] = list;
      }
    }

    if (!weightFn) {
      weightFn = (i, j) => {
        const x1 = Math.floor(i / ny), y1 = i % ny;
        const x2 = Math.floor(j / ny), y2 = j % ny;
        return (x1 !== x2 && y1 !== y2) ? sqrt2 : 1;
      };
    }

    return new Graph(n, i => nbs[i], weightFn);
  },

  /** Creates a 3D 6-connected voxel grid graph (face neighbors only). */
  grid3D6(nx: number, ny: number, nz: number, weightFn?: (a: number, b: number) => number): Graph {
    const nyz = ny * nz;
    const n = nx * ny * nz;
    const nbs: number[][] = new Array(n);

    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const list: number[] = [];
          if (x > 0) list.push((x - 1) * nyz + y * nz + z);
          if (x < nx - 1) list.push((x + 1) * nyz + y * nz + z);
          if (y > 0) list.push(x * nyz + (y - 1) * nz + z);
          if (y < ny - 1) list.push(x * nyz + (y + 1) * nz + z);
          if (z > 0) list.push(x * nyz + y * nz + z - 1);
          if (z < nz - 1) list.push(x * nyz + y * nz + z + 1);
          nbs[x * nyz + y * nz + z] = list;
        }

    return new Graph(n, i => nbs[i], weightFn ?? (() => 1));
  },
};
