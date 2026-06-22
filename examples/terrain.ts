/**
 * Tekto Example: Parametric Terrain
 *
 * Run with:
 *   import { sketch } from "tekto";
 *   // paste the sketch() call below
 */

import { sketch } from "tekto";

sketch((lab) => {
  // Parameters — these auto-generate sliders in the UI
  const size = lab.slider("Size", 2, 16, 8);
  const divs = lab.slider("Divisions", 4, 64, 32, { step: 1 });
  const amplitude = lab.slider("Amplitude", 0.1, 3, 0.8);
  const frequency = lab.slider("Frequency", 0.2, 4, 1.2);
  const wireframe = lab.toggle("Wireframe", false, { group: "Display" });
  const color = lab.colorPicker("Color", "#059669", { group: "Display" });

  // Generate terrain with a height function
  const terrain = lab.grid(
    size.value, size.value,
    divs.value, divs.value,
    (x, z) => {
      const f = frequency.value;
      return Math.sin(x * f) * Math.cos(z * f * 0.8) * amplitude.value
           + Math.sin(x * f * 2.3 + 1.7) * amplitude.value * 0.3
           + Math.cos(z * f * 1.5 + 0.8) * amplitude.value * 0.2;
    }
  );

  // Style
  terrain.color(color.value).wireframe(wireframe.value);

  // Stats
  lab.log("Vertices", terrain.nodeCount());
  lab.log("Faces", terrain.faceCount());
  lab.log("Volume", terrain.volume().toFixed(3));
}, {
  title: "Parametric Terrain",
});
