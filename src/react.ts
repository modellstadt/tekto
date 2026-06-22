// tekto/react — optional React layer (Level 3).
//
// Kept out of the main "tekto" barrel so that consumers writing plain
// (non-React) apps don't need react / react-dom installed. Import these from
// "tekto/react" — that subpath requires react + react-dom as peer deps.
export {
  TektoApp, useScene, useSceneObjects, useSelection, useParams,
  ParamPanel, InspectorPanel, Toolbar,
} from "./react/components";
export type { ToolbarAction } from "./react/components";
