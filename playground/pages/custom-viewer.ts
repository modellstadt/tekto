/**
 * Custom Viewer — an app with its own UI and no shell: a Scene and a ThreeRenderer, and the
 * pieces the shells are made of, mounted where this app wants them. The viewer toolbar sits
 * in its own header; the shading bar and the axis widget in the view; ✎ Markup over it.
 * A React app does the same with `tekto/react` (`ViewerToolbar`, `Markup`).
 */
import { Scene, ThreeRenderer, MeshFactory, viewerToolbar, markup } from "../../src";

export default function (container: HTMLElement) {
  container.style.display = "flex";
  container.style.flexDirection = "column";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:12px;padding:6px 12px;border-bottom:1px solid #1d2030;"
    + "color:#cfd3dc;font:600 12px system-ui,sans-serif;background:#0d0f17;";
  header.textContent = "Custom Viewer";
  const view = document.createElement("div");
  view.style.cssText = "flex:1;position:relative;min-height:0;";
  container.append(header, view);

  const scene = new Scene();
  const renderer = new ThreeRenderer(scene, view, {
    up: "z", navGizmo: true, shadingBar: true, gridStyle: "fading",
    cameraPosition: [11, -13, 9], cameraTarget: [0, 0, 1.5],
  });

  // Three blocks with labels and record keys: what a mark resolves to.
  [["A", -3.5, 3], ["B", 0, 5], ["C", 3.5, 2]].forEach(([name, x, h]) => {
    const m = MeshFactory.box(2.4, 2.4, h as number);
    m.translate(x as number, 0, (h as number) / 2);
    scene.withKey(`blocks/${name}`, () => scene.addMesh(m, { color: "#cfd8dc", label: `block ${name}` }));
  });

  const bar = viewerToolbar(scene, renderer, { cut: false });
  header.appendChild(bar.el);
  const notes = markup(renderer, scene, { title: "custom-viewer" });

  // Draw on demand: a frame when something changed.
  let raf = 0;
  const loop = () => { renderer.renderIfNeeded(); raf = requestAnimationFrame(loop); };
  loop();

  // For tests and agents.
  (window as unknown as { customViewer: unknown }).customViewer = { scene, renderer, markup: notes };

  return {
    dispose() {
      cancelAnimationFrame(raf);
      notes.dispose();
      bar.dispose();
      renderer.dispose();
      container.replaceChildren();
    },
  };
}
