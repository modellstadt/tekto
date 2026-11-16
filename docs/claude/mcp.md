# The MCP server

![The example house: what Claude writes from a short brief](/shots/house-framing.webp)

`tools/mcp.mjs` is an MCP server for the tekto app a person has open. Claude Code, Claude Desktop or any MCP client gets the app's document as tools: it reads the records and their schema, applies a patch, checks the result, looks at the view, and answers the notes people left on the model. All of it happens in the open tab while the person watches, and every edit is one undo step for them. It has no dependencies: JSON-RPC over stdio.

The app shares its document with `agentDoc`:

```ts
import { agentDoc, appShell, bindBuilding, buildingSchema, Doc, localAdapter, type BuildingRecords, type Note } from "tekto";

const doc = new Doc<BuildingRecords & { notes: Note }>({ name: "house", adapter: localAdapter() });
const app = appShell({
  container: document.getElementById("app")!,
  title: "House",
  params: {},
  notes: doc,
  shadingBar: true,
});
const house = bindBuilding(doc, app.scene);

// The records an agent may edit, their schema, and what the app's check says about them.
agentDoc(doc, { schema: buildingSchema(), check: () => house.issues });
```

The app's Vite config needs the relay plugin (the playground has it):

```js
// vite.config.mjs
import tektoMarkup from "tekto/markup-vite";
export default { plugins: [tektoMarkup()] };
```

Then register the server with Claude Code:

```bash
claude mcp add tekto -- node node_modules/tekto/tools/mcp.mjs
# TEKTO_URL=http://localhost:5174   another dev server port (default 5173)
# TEKTO_PAGE=house                  with several tabs open, the one whose URL or title contains this
```

## The tools

| Tool | Does |
|---|---|
| `tekto_info` | the app, its collections with their JSON Schema, open notes, controls, commands, errors. Call it first |
| `tekto_records` | the records, by collection |
| `tekto_apply` | a patch `{ set, update, remove }` by `"collection/id"`, checked against the schema, one undo step |
| `tekto_check` | the app's errors and warnings, each with its records |
| `tekto_notes`, `tekto_note_reply`, `tekto_note_resolve` | the notes people left, answered or marked done |
| `tekto_snapshot` | an image of the view and a summary of what is drawn |
| `tekto_section`, `tekto_camera` | cut a plan or move the camera before a snapshot |
| `tekto_set_params`, `tekto_run_command`, `tekto_undo` | controls, commands and undo, as a person would |
| `tekto_steps` | the program as its [steps](/claude/steps) |

## Build a house from a brief

1. `npm run playground`, open the House page and press **Empty site** (or open it with `&empty`).
2. `claude mcp add tekto -- node tools/mcp.mjs`, then ask Claude Code: *"Build me a compact two-storey timber family house, about 140 m²: open living and kitchen facing south, a study, three bedrooms, a gable roof."*
3. Claude reads the schema, writes the house in one patch, fixes what the checks report, and looks at it with a snapshot and a plan cut.

Tested with a fresh agent and only that brief: a 144 m² house in two patches, with doors, windows, a U stair to the landing and a gable roof. While it works, a chip at the top of the page names it and what it is doing.

::: tip Playground
[House](https://github.com/dbt-ethz/tekto/blob/main/playground/pages/house.ts): `?page=house`.
:::
