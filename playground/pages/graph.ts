/**
 * Graph — proximity graph with Dijkstra shortest path.
 * Port of HDGEO GraphTestPage.
 */
import { sketch, SketchInstance, Graph, Vec2 } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const nodeCount = lab.slider("Nodes", 5, 200, 60, { step: 1 });
    const connectRadius = lab.slider("Connect Radius", 0.5, 5, 1.8);
    const seed = lab.slider("Seed", 0, 1000, 42, { step: 1 });
    const source = lab.slider("Source", 0, nodeCount.value - 1, 0, { step: 1 });
    const target = lab.slider("Target", 0, nodeCount.value - 1, 1, { step: 1 });

    // Generate random node positions
    lab.randomSeed(seed.value);
    const range = 5;
    const positions: Vec2[] = [];
    for (let i = 0; i < nodeCount.value; i++) {
      positions.push(new Vec2(
        lab.random(-range, range),
        lab.random(-range, range),
      ));
    }

    // Build proximity graph
    const r2 = connectRadius.value * connectRadius.value;
    const edgeList: [number, number][] = [];
    for (let i = 0; i < nodeCount.value; i++) {
      for (let j = i + 1; j < nodeCount.value; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        if (dx * dx + dy * dy < r2) edgeList.push([i, j]);
      }
    }

    const graph = Graph.fromEdgeList(nodeCount.value, edgeList, true,
      (a, b) => {
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        return Math.sqrt(dx * dx + dy * dy);
      });

    // Draw edges
    for (const [a, b] of edgeList) {
      lab.line(positions[a].x, 0, positions[a].y,
               positions[b].x, 0, positions[b].y).color("#4d4d59");
    }

    // Run Dijkstra
    const src = Math.min(source.value, nodeCount.value - 1);
    const tgt = Math.min(target.value, nodeCount.value - 1);
    const { dist, pred } = graph.dijkstra(src);

    let maxDist = 0;
    for (const d of dist) {
      if (d < Infinity && d > maxDist) maxDist = d;
    }

    const path = Graph.tracePath(pred, tgt);

    // Draw shortest path
    for (let i = 0; i < path.length - 1; i++) {
      lab.line(
        positions[path[i]].x, 0.01, positions[path[i]].y,
        positions[path[i + 1]].x, 0.01, positions[path[i + 1]].y,
      ).color("#ffd91a");
    }

    // Draw nodes
    for (let i = 0; i < positions.length; i++) {
      let color: string;
      if (i === src) color = "#33e64d";
      else if (i === tgt) color = "#e63333";
      else if (dist[i] < Infinity) {
        const t = dist[i] / Math.max(maxDist, 0.01);
        const r = Math.round(77 + 128 * t);
        const g = Math.round(128 + 77 * t);
        const b = Math.round(230 - 77 * t);
        color = `rgb(${r},${g},${b})`;
      } else {
        color = "#666666";
      }
      const size = (i === src || i === tgt) ? 0.12 : 0.07;
      lab.point(positions[i].x, 0.02, positions[i].y).color(color).size(size);
    }

    lab.info("Graph — Dijkstra shortest path");
    lab.log("Edges", edgeList.length);
    lab.log("Path length", path.length);
    if (path.length >= 2 && dist[tgt] < Infinity) {
      lab.log("Distance", dist[tgt].toFixed(2));
    } else {
      lab.info("No path found!");
    }
  }, {
    container,
    title: "Graph",
    background: 0x0a0b14,
    camera: [0, 14, 0],
    target: [0, 0, 0],
  });
}
