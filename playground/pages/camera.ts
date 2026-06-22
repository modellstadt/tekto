/**
 * Camera — Reference cubes showing axis orientation.
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
  }, {
    container,
    title: "Camera",
    background: 0x0a0b14,
    camera: [6, 6, 8],
    target: [0, 1, 0],
  });
}
