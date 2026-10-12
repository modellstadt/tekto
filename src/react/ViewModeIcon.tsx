// The view-mode icon as a React component: the same shapes
// viewModeIconSvg draws as a string (render/viewModeIcons.ts), so a DOM
// toolbar and a React one show the same cube.
import type { SVGProps } from "react";
import type { ViewMode } from "../render/Viewport";
import { VIEW_MODE_ICON_SVG, viewModeIconShapes } from "../render/viewModeIcons";

export function ViewModeIcon({ mode, ...props }: { mode: ViewMode } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...VIEW_MODE_ICON_SVG} aria-hidden="true" {...props}>
      {viewModeIconShapes(mode).map((s, i) => s.kind === "line"
        ? <line key={i} x1={s.from[0]} y1={s.from[1]} x2={s.to[0]} y2={s.to[1]}
            strokeOpacity={s.opacity} />
        : <polygon key={i} points={s.points}
            fill={s.fill !== undefined ? "currentColor" : undefined} fillOpacity={s.fill}
            stroke={s.stroke ? undefined : "none"} />)}
    </svg>
  );
}
