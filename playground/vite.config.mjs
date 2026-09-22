// Dev-server config for the playground (`npm run playground` → `vite playground`).
// The markup plugin saves ✎ Markup / tools/snap.mjs bundles to .tekto/markup/.
import tektoMarkup from "../tools/markup-vite-plugin.mjs";

export default {
  plugins: [tektoMarkup()],
};
