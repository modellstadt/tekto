/**
 * Layers — lab.layerTree(): a nested tree with a visibility checkbox and a
 * square colour swatch per layer. Hiding a parent masks its children
 * without changing their own state (computeEffectiveVisibility).
 */
import { sketch, SketchInstance, computeEffectiveVisibility, type LayerNode } from "../../src";

const NODES: LayerNode[] = [
  { id: "structure", label: "Structure", defaultColor: "#9ca3af", children: [
    { id: "columns", label: "Columns", defaultColor: "#ef4444" },
    { id: "beams",   label: "Beams",   defaultColor: "#3b82f6" },
  ]},
  { id: "slab",   label: "Slab",   defaultColor: "#d1d5db" },
  { id: "guides", label: "Guides", defaultColor: "#22c55e", defaultVisible: false },
];

// The layer map holds only the layers the user has changed, so colours fall
// back to the nodes' defaults.
const DEFAULT_COLOR: Record<string, string> = {};
const collect = (n: LayerNode) => { DEFAULT_COLOR[n.id] = n.defaultColor ?? "#888888"; n.children?.forEach(collect); };
NODES.forEach(collect);

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const layers = lab.layerTree("Layers", NODES).value;
    const shown = computeEffectiveVisibility(NODES, layers);
    const color = (id: string) => layers[id]?.color ?? DEFAULT_COLOR[id];

    const xs = [-3, 3];
    if (shown.columns) {
      for (const x of xs) for (const z of xs) {
        lab.box(0.4, 3, 0.4).color(color("columns")).translate(x, 1.5, z);
      }
    }
    if (shown.beams) {
      for (const z of xs) lab.box(6.4, 0.4, 0.4).color(color("beams")).translate(0, 3.2, z);
    }
    if (shown.slab) lab.box(7, 0.2, 7).color(color("slab")).translate(0, 3.5, 0);
    if (shown.guides) {
      for (const x of xs) lab.line(x, 0.01, -5, x, 0.01, 5).color(color("guides"));
    }

    lab.info(`Columns: ${color("columns")}`);
  }, {
    container,
    title: "Layers",
    background: 0x0a0b14,
    camera: [9, 7, 11],
    target: [0, 1.5, 0],
  });
}
