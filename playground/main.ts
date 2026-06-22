import { sketch } from "../src";

sketch((lab) => {
  // ── GUI Controls ──
  const speed = lab.slider("Speed", 0, 3, 1, { group: "Animation" });
  const showWire = lab.toggle("Wireframe", false, { group: "Display" });
  const baseColor = lab.colorPicker("Color", "#38d9a9", { group: "Display" });

  // ── Noise-driven terrain ──
  const terrain = lab.grid(8, 8, 32, 32, (x, z) => {
    return lab.noise(x * 0.5, z * 0.5) * 2;
  });
  terrain.color(baseColor.value).wireframe(showWire.value).opacity(0.8);

  // ── Sphere with rgb() color helper ──
  const n = lab.noise(lab.time * speed.value * 0.3);
  const sphere = lab.sphere(0.5 + n * 0.5);
  sphere
    .color(lab.rgb(255, lab.floor(n * 255), 50))
    .translate(0, 2 + n, 0);

  // ── Box with rotation ──
  const box = lab.box(1, 1, 1);
  box
    .color(lab.rgb(100, 200, 150))
    .rotateY(lab.time * speed.value)
    .translate(-3, 1, 0);

  // ── Torus with rotateX ──
  const torus = lab.torus(1, 0.3);
  torus
    .color(lab.rgb(50, 150, 255))
    .rotateX(lab.time * speed.value * 0.5)
    .translate(3, 1, 0);

  // ── Random points ──
  lab.randomSeed(42);
  for (let i = 0; i < 20; i++) {
    const x = lab.random(-4, 4);
    const z = lab.random(-4, 4);
    const y = lab.noise(x * 0.5, z * 0.5) * 2 + 0.1;
    lab.point(x, y, z).color("#ff6b6b").size(0.08);
  }

  // ── beginShape: custom triangle ──
  lab.beginShape("triangles");
  lab.vertex(0, 3.5, 2);
  lab.vertex(-0.5, 3, 2);
  lab.vertex(0.5, 3, 2);
  const tri = lab.endShape();
  if (tri && "color" in tri) {
    (tri as any).color(lab.rgb(255, 200, 0));
  }

  // ── Lines via beginShape ──
  lab.beginShape("line_strip");
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = lab.lerp(-4, 4, t);
    const y = lab.sin(t * lab.TWO_PI + lab.time * speed.value) * 0.5 + 3.5;
    lab.vertex(x, y, -2);
  }
  const wave = lab.endShape();
  if (wave) wave.color("#ff6b6b");

  // ── Mouse & keyboard callbacks ──
  lab.onKeyPressed((key) => {
    lab.log("Key pressed", key);
  });

  // ── Logs ──
  lab.log("Frame", lab.frame);
  lab.log("Noise", n.toFixed(3));
  lab.log("Mouse", `${lab.mouseX.toFixed(0)}, ${lab.mouseY.toFixed(0)}`);
  lab.log("Math check", `PI=${lab.PI.toFixed(4)}, sin(PI/2)=${lab.sin(lab.HALF_PI).toFixed(2)}`);

  // ── Animation loop (re-runs each frame for smooth motion) ──
  lab.animate((time, dt) => {
    // The sketch auto-reruns on param changes;
    // animate is for per-frame updates without full re-run
  });
}, {
  title: "Tekto Playground",
  background: 0x0a0b14,
  camera: [6, 8, 10],
  target: [0, 1, 0],
});
