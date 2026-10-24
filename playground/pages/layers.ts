/**
 * Layers — lab.layerTree(), laid out like Rhino's layer panel: per layer an
 * active-layer check, an on/off bulb, a lock and a colour swatch.
 *
 * Turning a parent off masks its children without changing their own state
 * (computeEffectiveVisibility). Objects tagged `.layer(id)` on a locked layer
 * can't be picked: the click goes through to what is behind. The button adds
 * a post on the active layer — where new objects go.
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

// Kept across re-runs: the posts added so far (each on the layer that was
// active then) and what the last click picked.
const posts: string[] = [];
let picked = "nothing";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const tree = lab.layerTree("Layers", NODES);
    const layers = tree.value;
    const shown = computeEffectiveVisibility(NODES, layers);
    const color = (id: string) => layers[id].color;

    const xs = [-3, 3];
    if (shown.columns) {
      for (const x of xs) for (const z of xs) {
        lab.box(0.4, 3, 0.4).color(color("columns")).layer("columns").translate(x, 1.5, z);
      }
    }
    if (shown.beams) {
      for (const z of xs) lab.box(6.4, 0.4, 0.4).color(color("beams")).layer("beams").translate(0, 3.2, z);
    }
    if (shown.slab) lab.box(7, 0.2, 7).color(color("slab")).layer("slab").translate(0, 3.5, 0);
    if (shown.guides) {
      for (const x of xs) lab.line(x, 0.01, -5, x, 0.01, 5).color(color("guides")).layer("guides");
    }
    posts.forEach((layer, i) => {
      if (shown[layer]) lab.box(0.25, 1, 0.25).color(color(layer)).layer(layer).translate(-3 + i * 0.6, 0.5, 5);
    });

    lab.button("Add a post on the active layer", () => { posts.push(tree.active); });
    lab.enablePicking(true);
    lab.onPick((id, pick) => { picked = id ? pick?.layer ?? "an untagged object" : "nothing"; });

    lab.log("Active layer", tree.active);
    lab.log("Picked", picked);
    lab.log("Columns", color("columns"));
  }, {
    container,
    title: "Layers",
    background: 0x0a0b14,
    camera: [9, 7, 11],
    target: [0, 1.5, 0],
  });
}
