// The view-mode icon as a React component: the same shapes viewModeIconSvg draws as a
// string (gui/viewModeIcons.ts), so a DOM toolbar and a React one show the same cube.
import type { SVGProps } from "react";
import type { RenderMode } from "../scene/Scene";
import { VIEW_MODE_ICON_SVG, viewModeIconShapes } from "../gui/viewModeIcons";

/** A cube drawn the way a render mode draws (solid, ghost, hidden line, wireframe), in `currentColor`: `<ViewModeIcon mode="ghost" width={16} />`. */
export function ViewModeIcon({ mode, ...props }: { mode: RenderMode } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...VIEW_MODE_ICON_SVG} aria-hidden="true" {...props}>
      {viewModeIconShapes(mode).map((s, i) => s.kind === "line"
        ? <line key={i} x1={s.from[0]} y1={s.from[1]} x2={s.to[0]} y2={s.to[1]} strokeOpacity={s.opacity} />
        : <polygon key={i} points={s.points}
            fill={s.fill !== undefined ? "currentColor" : undefined} fillOpacity={s.fill}
            stroke={s.stroke ? undefined : "none"} />)}
    </svg>
  );
}
