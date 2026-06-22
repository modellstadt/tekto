/**
 * Re-export shim — algorithms have moved to:
 *   - src/core/geometry/Polygon2D.ts  (2D polygon operations)
 *   - src/core/geometry/mesh/MeshAnalysis.ts  (mesh operations)
 *
 * Import from the new locations for new code.
 */

import { Polygon2D } from "../geometry/Polygon2D";
import { MeshAnalysis } from "../geometry/mesh/MeshAnalysis";

export const Algo = { ...Polygon2D, ...MeshAnalysis };
