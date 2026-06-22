/**
 * Tekto SVG Renderer
 *
 * Renders Scene objects as SVG for clean 2D visualization.
 * Supports labels, annotations, and CSS styling.
 * Uses XZ plane projection by default.
 */

import { Scene as GScene, SceneObject } from "../scene/Scene";
import { Vec3 } from "../core/math/vectors";

export interface SVGRendererConfig {
  width: number;
  height: number;
  viewBox: { minX: number; minY: number; width: number; height: number };
  backgroundColor: string;
  showGrid: boolean;
  gridSpacing: number;
  gridColor: string;
  showLabels: boolean;
  projection: "xz" | "xy" | "yz";
  padding: number;
  pointRadius: number;
}

const DEFAULTS: SVGRendererConfig = {
  width: 800,
  height: 600,
  viewBox: { minX: -5, minY: -5, width: 10, height: 10 },
  backgroundColor: "#0a0b14",
  showGrid: true,
  gridSpacing: 1,
  gridColor: "#1a1c3a",
  showLabels: true,
  projection: "xz",
  padding: 20,
  pointRadius: 5,
};

export class SVGRenderer {
  private gScene: GScene;
  private config: SVGRendererConfig;
  private svg: SVGSVGElement;
  private contentGroup: SVGGElement;
  private gridGroup: SVGGElement;
  private unsub: (() => void) | null = null;

  constructor(gScene: GScene, container: HTMLElement, config?: Partial<SVGRendererConfig>) {
    this.gScene = gScene;
    this.config = { ...DEFAULTS, ...config };
    const c = this.config;

    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", String(c.width));
    this.svg.setAttribute("height", String(c.height));
    this.svg.setAttribute("viewBox", `${c.viewBox.minX} ${c.viewBox.minY} ${c.viewBox.width} ${c.viewBox.height}`);
    this.svg.style.background = c.backgroundColor;
    this.svg.style.display = "block";
    container.appendChild(this.svg);

    // Grid
    this.gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.svg.appendChild(this.gridGroup);
    if (c.showGrid) this.drawGrid();

    // Content
    this.contentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Flip Y so positive Y goes up
    this.contentGroup.setAttribute("transform", "scale(1, -1)");
    this.svg.appendChild(this.contentGroup);

    // Subscribe
    this.unsub = gScene.on(() => this.render());
    this.render();
  }

  private project(v: Vec3): { x: number; y: number } {
    switch (this.config.projection) {
      case "xz": return { x: v.x, y: v.z };
      case "xy": return { x: v.x, y: v.y };
      case "yz": return { x: v.y, y: v.z };
    }
  }

  private drawGrid() {
    const { viewBox: vb, gridSpacing: gs, gridColor } = this.config;
    const startX = Math.floor(vb.minX / gs) * gs;
    const startY = Math.floor(vb.minY / gs) * gs;
    const endX = vb.minX + vb.width;
    const endY = vb.minY + vb.height;

    for (let x = startX; x <= endX; x += gs) {
      const line = this.createSVGLine(x, vb.minY, x, vb.minY + vb.height, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }
    for (let y = startY; y <= endY; y += gs) {
      const line = this.createSVGLine(vb.minX, y, vb.minX + vb.width, y, gridColor, 0.02);
      this.gridGroup.appendChild(line);
    }

    // Axes
    this.gridGroup.appendChild(this.createSVGLine(vb.minX, 0, endX, 0, "#2a3055", 0.04));
    this.gridGroup.appendChild(this.createSVGLine(0, vb.minY, 0, endY, "#2a3055", 0.04));
  }

  render() {
    while (this.contentGroup.firstChild) this.contentGroup.removeChild(this.contentGroup.firstChild);

    for (const obj of this.gScene.all()) {
      if (!obj.style.visible) continue;
      this.renderObject(obj);
    }
  }

  private renderObject(obj: SceneObject) {
    const s = obj.style;
    const pr = this.config.pointRadius * this.config.viewBox.width / this.config.width;

    switch (obj.type) {
      case "point": {
        if (!obj.position) break;
        const p = this.project(obj.position);
        const circle = this.createSVGCircle(p.x, p.y, pr, s.color, s.opacity);
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);

        if (s.label && this.config.showLabels) {
          const text = this.createSVGText(p.x + pr * 2, p.y + pr * 2, s.label, s.labelColor ?? s.color);
          text.setAttribute("transform", `scale(1,-1)`);
          text.setAttribute("y", String(-p.y - pr * 2));
          this.contentGroup.appendChild(text);
        }
        break;
      }

      case "segment": {
        if (!obj.start || !obj.end) break;
        const a = this.project(obj.start);
        const b = this.project(obj.end);
        const line = this.createSVGLine(a.x, a.y, b.x, b.y, s.color, 0.03, s.opacity);
        line.dataset.geomId = obj.id;
        this.contentGroup.appendChild(line);
        break;
      }

      case "polygon": {
        if (!obj.vertices || obj.vertices.length < 2) break;
        const pts = obj.vertices.map(v => this.project(v));
        const poly = this.createSVGPolygon(pts, s.color, s.opacity);
        poly.dataset.geomId = obj.id;
        this.contentGroup.appendChild(poly);
        break;
      }

      case "circle": {
        if (!obj.center || obj.radius == null) break;
        const c = this.project(obj.center);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", String(c.x));
        circle.setAttribute("cy", String(c.y));
        circle.setAttribute("r", String(obj.radius));
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", s.color);
        circle.setAttribute("stroke-width", "0.03");
        circle.setAttribute("opacity", String(s.opacity));
        circle.dataset.geomId = obj.id;
        this.contentGroup.appendChild(circle);
        break;
      }

      case "mesh": {
        // Render mesh faces as polygons
        if (!obj.mesh) break;
        for (const face of obj.mesh.faces()) {
          const pts = face.nodes.map(nid => {
            const node = obj.mesh!.node(nid);
            return node ? this.project(node.position) : { x: 0, y: 0 };
          });
          const poly = this.createSVGPolygon(pts, s.color, s.opacity * 0.3);
          this.contentGroup.appendChild(poly);
        }
        // Render edges
        for (const edge of obj.mesh.edges()) {
          const a = obj.mesh.node(edge.nodes[0]);
          const b = obj.mesh.node(edge.nodes[1]);
          if (!a || !b) continue;
          const pa = this.project(a.position);
          const pb = this.project(b.position);
          this.contentGroup.appendChild(
            this.createSVGLine(pa.x, pa.y, pb.x, pb.y, s.color, 0.02, s.opacity * 0.5)
          );
        }
        break;
      }
    }
  }

  // ── SVG Helpers ──

  private createSVGCircle(cx: number, cy: number, r: number, color: string, opacity = 1): SVGCircleElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", String(cx));
    el.setAttribute("cy", String(cy));
    el.setAttribute("r", String(r));
    el.setAttribute("fill", color);
    el.setAttribute("opacity", String(opacity));
    return el;
  }

  private createSVGLine(x1: number, y1: number, x2: number, y2: number, color: string, width = 0.02, opacity = 1): SVGLineElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
    el.setAttribute("x1", String(x1));
    el.setAttribute("y1", String(y1));
    el.setAttribute("x2", String(x2));
    el.setAttribute("y2", String(y2));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", String(width));
    el.setAttribute("opacity", String(opacity));
    return el;
  }

  private createSVGPolygon(pts: { x: number; y: number }[], color: string, opacity = 0.5): SVGPolygonElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    el.setAttribute("points", pts.map(p => `${p.x},${p.y}`).join(" "));
    el.setAttribute("fill", color);
    el.setAttribute("fill-opacity", String(opacity));
    el.setAttribute("stroke", color);
    el.setAttribute("stroke-width", "0.03");
    return el;
  }

  private createSVGText(x: number, y: number, text: string, color: string): SVGTextElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.setAttribute("x", String(x));
    el.setAttribute("y", String(y));
    el.setAttribute("fill", color);
    el.setAttribute("font-size", "0.2");
    el.setAttribute("font-family", "monospace");
    el.textContent = text;
    return el;
  }

  /** Update the viewBox (pan/zoom) */
  setViewBox(minX: number, minY: number, width: number, height: number) {
    this.config.viewBox = { minX, minY, width, height };
    this.svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    this.render();
  }

  dispose() {
    this.unsub?.();
    this.svg.remove();
  }
}
