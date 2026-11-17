# Lighting

<Live page="house" label="House" poster="/shots/house-sunset.webp" alt="The house in Studio light with a sunset sun" />

<Live page="app-shell" label="App Shell" />

There are two lighting presets. **Flat** is the default: cheap lights, no shadows, fast for inspection and large models. **Studio** uses physically based materials, one sun with soft shadows framed to the content, ACES tone mapping and an invisible ground that catches contact shadows; it is two to three times slower per frame and made for renderings and daylight studies. Ambient occlusion darkens corners and contacts in either.

```ts
import { appShell, MeshFactory, SunPosition, Vec3 } from "tekto";

const app = appShell({
  container: document.getElementById("app")!,
  title: "Daylight",
  params: {},
  shadingBar: true,
  camera: [10, -10, 7],
  target: [0, 0, 1],
});
const block = MeshFactory.box(3, 3, 3);
block.translate(0, 0, 1.5);
app.scene.addMesh(block, { color: "#e4e1da" });

app.scene.setLightingMode("studio");                  // "flat" | "studio"
app.renderer.setAmbientOcclusion(true);
app.renderer.setSunPreset("sunset");                  // "morning" | "noon" | "sunset"

// The sun for a place and time: Zurich, midsummer, 11:30 UTC
const sun = SunPosition.compute({ date: new Date(Date.UTC(2026, 5, 21, 11, 30)), latitude: 47.37, longitude: 8.55 });
if (sun.isDaytime) app.renderer.setSunDirection(sun.direction);

// Lights are scene objects, like the geometry
app.scene.addLight(new Vec3(0, 0, 3.4), { intensity: 3, range: 4 }, { color: "#ffd2a0" });
```

## What to know

- `SunPosition` is accurate to about 0.01° between 1950 and 2050. Its direction is Z-up: +X east, +Y north.
- In a `sketch()`, `lab.setSunDirection(dir)` overrides the sun each run, for an animated day; `lab.lightingMode` tells you which preset the person chose.
- Flat lighting is tuned for a dark page. For a model whose colours are a key, `appShell({ renderer: { flatLighting: "plain" } })` shows each colour as it is.

::: tip Playground
[App Shell](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/app-shell.ts) (`?page=app-shell`) has lamps under its floors; the testbench's Sun popover drives every 3D page.
:::
