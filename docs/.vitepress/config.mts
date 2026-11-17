import { renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "vite";
import { defineConfig } from "vitepress";

// The documentation site: `npm run docs:dev`, `npm run docs:build` (→ docs/.vitepress/dist).
// Published to GitHub Pages (dbt-ethz.github.io/tekto) from main by .github/workflows/docs.yml.
// Screenshots in docs/public/shots come from the playground: `node tools/doc-shots.mjs`.

const GITHUB = "https://github.com/dbt-ethz/tekto";

// The playground lives next to the docs: `docs:build` builds it into dist/play/, and every
// "Open live" button opens a page of it there. `docs:dev` doesn't serve it, so while writing
// the docs the buttons go to the playground's own dev server (`npm run playground`).
const DEV = process.argv.includes("dev");
const PLAYGROUND = DEV ? "http://localhost:5173/testbench.html" : "/play/";

/** After the docs: the playground's page shell, built static into <outDir>/play. */
async function buildPlayground(outDir: string, base: string) {
  const root = resolve(__dirname, "../../playground");
  const out = join(outDir, "play");
  await build({
    root,
    base: `${base}play/`,
    configFile: join(root, "vite.config.mjs"),
    logLevel: "warn",
    build: {
      outDir: out,
      emptyOutDir: true,
      chunkSizeWarningLimit: 4000,
      rollupOptions: { input: join(root, "testbench.html") },
    },
  });
  renameSync(join(out, "testbench.html"), join(out, "index.html"));
}

export default defineConfig({
  title: "tekto",
  description: "An AI-first CAD and computational geometry library for the browser, from DBT, ETH Zurich.",
  base: "/tekto/",
  lang: "en",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/tekto/logo.svg" }]],
  ignoreDeadLinks: [/^\/play\//],
  buildEnd: (site) => buildPlayground(site.outDir, site.site.base),
  markdown: {
    image: { lazyLoading: true },
  },
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "tekto",
    playground: PLAYGROUND,
    repo: GITHUB,
    nav: [
      { text: "Guide", link: "/guide/why" },
      { text: "Playground", link: PLAYGROUND, target: "_blank" },
      { text: "API index", link: `${GITHUB}/blob/main/llms-full.txt` },
      { text: "Changelog", link: `${GITHUB}/blob/main/CHANGELOG.md` },
    ],
    socialLinks: [{ icon: "github", link: GITHUB }],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    editLink: {
      pattern: `${GITHUB}/edit/main/docs/:path`,
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "MIT licensed. Digital Building Technologies, ETH Zurich.",
    },
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Why tekto", link: "/guide/why" },
          { text: "Getting started", link: "/guide/getting-started" },
        ],
      },
      {
        text: "The interface",
        items: [
          { text: "A tekto app", link: "/interface/tour" },
          { text: "Looking at the model", link: "/interface/view" },
          { text: "Selecting, editing, telling Claude", link: "/interface/editing" },
          { text: "The playground", link: "/interface/playground" },
        ],
      },
      {
        text: "Apps",
        items: [
          { text: "sketch: a 3D study", link: "/apps/sketch" },
          { text: "sketch2d: a 2D canvas", link: "/apps/sketch2d" },
          { text: "appShell: an app people edit", link: "/apps/app-shell" },
        ],
      },
      {
        text: "Geometry",
        items: [
          { text: "Vectors", link: "/geometry/vectors" },
          { text: "Mesh", link: "/geometry/mesh" },
          { text: "MeshFactory", link: "/geometry/mesh-factory" },
          { text: "MeshTransform", link: "/geometry/mesh-transform" },
          { text: "Booleans", link: "/geometry/booleans" },
        ],
      },
      {
        text: "Curves and surfaces",
        items: [
          { text: "Curves", link: "/curves/curves" },
          { text: "NURBS", link: "/curves/nurbs" },
          { text: "Curvature and streamlines", link: "/curves/streamlines" },
        ],
      },
      {
        text: "2D",
        items: [
          { text: "Polygons", link: "/2d/polygons" },
          { text: "Voronoi", link: "/2d/voronoi" },
          { text: "Packing", link: "/2d/packing" },
        ],
      },
      {
        text: "Buildings as data",
        items: [
          { text: "Doc: the retained model", link: "/buildings/doc" },
          { text: "Building records", link: "/buildings/records" },
          { text: "A house", link: "/buildings/house" },
          { text: "Roofs", link: "/buildings/roofs" },
          { text: "Walls, slabs and framing", link: "/buildings/framing" },
          { text: "Stairs", link: "/buildings/stairs" },
        ],
      },
      {
        text: "Drawings",
        items: [
          { text: "Sheet", link: "/drawings/sheet" },
          { text: "SheetCanvas", link: "/drawings/sheet-canvas" },
        ],
      },
      {
        text: "Viewer and rendering",
        items: [
          { text: "Render modes", link: "/viewer/render-modes" },
          { text: "Lighting", link: "/viewer/lighting" },
          { text: "Sections", link: "/viewer/sections" },
          { text: "Callouts", link: "/viewer/callouts" },
        ],
      },
      {
        text: "Collaboration and notes",
        items: [
          { text: "Shared editing", link: "/collaboration/shared-editing" },
          { text: "Markup and notes", link: "/collaboration/notes" },
        ],
      },
      {
        text: "Working with Claude",
        items: [
          { text: "The MCP server", link: "/claude/mcp" },
          { text: "The agent relay", link: "/claude/relay" },
          { text: "Steps: a program as a graph", link: "/claude/steps" },
        ],
      },
      {
        text: "Import and export",
        items: [
          { text: "OBJ", link: "/io/obj" },
          { text: "IFC", link: "/io/ifc" },
          { text: "DXF", link: "/io/dxf" },
          { text: "PDF", link: "/io/pdf" },
        ],
      },
    ],
  },
});
