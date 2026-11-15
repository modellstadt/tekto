/**
 * Camera — Reference cubes showing axis orientation, in the viewer header layout
 * (`shadingBar: "header"`): the page's own view buttons in the header's left slot, the
 * shading icons and ✎ Markup on its right, the axis widget and the zoom column top right.
 * Port of HDGEO CameraTestPage (Y-up adaptation).
 */
import { sketch, SketchInstance } from "../../src";

export default function (container: HTMLElement): SketchInstance {
  return sketch((lab) => {
    const d = 4;

    // RGB axis lines
    lab.line(0, 0, 0, d, 0, 0).color("#ff0000");
    lab.line(0, 0, 0, 0, d, 0).color("#00ff00");
    lab.line(0, 0, 0, 0, 0, d).color("#0000ff");

    // Reference cubes at axis endpoints
    lab.box(0.3, 0.3, 0.3).color("#ff4d4d").translate(d, 0.15, 0);   // +X red
    lab.box(0.3, 0.3, 0.3).color("#4dff4d").translate(0, d, 0);       // +Y green
    lab.box(0.3, 0.3, 0.3).color("#4d4dff").translate(0, 0.15, d);   // +Z blue

    // Y-up indicator cone (tall narrow cylinder at Y=d)
    lab.cylinder(0, 0.15, 0.4, 12).color("#4d4dff").translate(0, d + 0.2, 0);

    // Origin marker
    lab.sphere(0.1, 8, 6).color("#ffffff").translate(0, 0, 0);

    lab.info("Camera info:");
    lab.info("Orbit: click + drag");
    lab.info("Pan: right-click + drag");
    lab.info("Zoom: scroll wheel");
    lab.info("");
    lab.info("Reference cubes at:");
    lab.log("Red", "+X (4, 0, 0)");
    lab.log("Green", "+Y (0, 4, 0)");
    lab.log("Blue", "+Z (0, 0, 4)");
    lab.info("Y-up orientation (Three.js)");

    // The app's own controls go in the header's left slot — added once, they persist across re-runs.
    const left = lab.viewerHeader?.left;
    if (left && !left.childElementCount) {
      for (const [label, view] of [["Top", "top"], ["Front", "front"], ["Iso", "iso"]] as const) {
        const b = document.createElement("button");
        b.textContent = label;
        b.style.cssText = "font:11px system-ui,sans-serif;padding:3px 9px;border-radius:5px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#cfd3e0;cursor:pointer;";
        b.onclick = () => lab.setView(view);
        left.appendChild(b);
      }
    }
  }, {
    container,
    title: "Camera",
    background: 0x0a0b14,
    shadingBar: "header",
    navGizmo: true,
    camera: [6, 6, 8],
    target: [0, 1, 0],
  });
}
