# Getting started

![Six primitives from a first sketch](/shots/primitives.webp)

tekto is installed straight from GitHub. The built files are in the repository, so there is no build step on install.

To see what it does first, nothing to install: <Live />

## Install

In a project that uses [Vite](https://vitejs.dev/) (or any bundler for ES modules):

```bash
npm install github:dbt-ethz/tekto three
# add react react-dom only if you import from "tekto/react"
```

To stay on one release, name its tag: `npm install github:dbt-ethz/tekto#v0.10.1 three`.

## A first sketch

`main.ts`:

```ts
import { sketch } from "tekto";

sketch((lab) => {
  const r = lab.slider("Radius", 0.1, 3, 1.5);
  const segs = lab.slider("Segments", 8, 64, 24, { step: 1 });

  const s = lab.sphere(r.value, segs.value);
  s.color("#c9b79c");

  lab.log("Volume", s.volume().toFixed(3));
  lab.log("Vertices", s.nodeCount().toString());
});
```

`index.html`:

```html
<!DOCTYPE html>
<html><body><div id="app"></div><script type="module" src="./main.ts"></script></body></html>
```

`npx vite` serves it: a 3D view with the sliders on the right. Move a slider and the function runs again with the new value. That is the whole model of a sketch: see [sketch](/apps/sketch).

## Run the playground

The playground is a testbench with a page for every part of the library. Each page's source is a good example of the API it shows.

```bash
git clone https://github.com/dbt-ethz/tekto.git
cd tekto
npm install
npm run playground       # then open testbench.html?page=house, ?page=nurbs-surfaces, …
```

Every feature page in these docs links the playground page that shows it.

## Look at what you made

With the dev server running, `npm run snap` captures a page as a person sees it:

```bash
npm run snap -- "http://localhost:5173/testbench.html?page=mesh-factory" --params '{"Subdivision Levels":2}'
```

It writes `.tekto/markup/latest/view.png` and `markup.json` (camera, params, log lines, errors) and exits 1 if the page logged an error. An agent uses it to check its own change; so can you.

## Next

- [sketch](/apps/sketch), [sketch2d](/apps/sketch2d) and [appShell](/apps/app-shell): the three kinds of app.
- [Mesh](/geometry/mesh) and [MeshFactory](/geometry/mesh-factory): the geometry most sketches use.
- [Working with Claude](/claude/mcp): an agent in the app you have open.
