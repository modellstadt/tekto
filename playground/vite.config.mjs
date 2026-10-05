// Dev-server config for the playground (`npm run playground` → `vite playground`).
// The markup plugin saves ✎ Markup / tools/snap.mjs bundles to .tekto/markup/; the collab
// plugin is the backend of devServerAdapter() (the "Shared Editing" page) → .tekto/collab/.
import tektoMarkup from "../tools/markup-vite-plugin.mjs";
import tektoCollab from "../tools/collab-vite-plugin.mjs";

export default {
  plugins: [tektoMarkup(), tektoCollab()],
};
