/** Corner of the view the bar sits in. */
type ShadingBarCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
/** Where the bar sits: a corner of the view, or `"header"` — a strip across the top of the view, as
 *  Blender's viewport header: the app's own controls on its left (`renderer.viewerHeader.left`), the
 *  shading icons, the snapshot and ✎ Markup on its right, and zoom in / out / to bounds in a column
 *  under the axis widget (the hand above them in a strict-2D view). */
type ShadingBarPlacement = ShadingBarCorner | "header";

export type { ShadingBarPlacement as S, ShadingBarCorner as a };
