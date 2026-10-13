// The viewer toolbar as a React component: the same bar appShell shows (viewerToolbar), mounted
// into a div, so a React app has lighting, AO, render mode, camera, cut and sun without copying it.
import { useEffect, useRef, type CSSProperties } from "react";
import type { Scene } from "../scene/Scene";
import type { ThreeRenderer } from "../render/ThreeRenderer";
import type { Theme } from "../gui/theme";
import { viewerToolbar, type TopBarOptions } from "../sketch/ViewerToolbar";

/** The viewer toolbar (`viewerToolbar`) as a component: `<ViewerToolbar scene={scene} renderer={renderer} options={{ cut: false }} />`. */
export function ViewerToolbar({ scene, renderer, options, theme, className, style }: {
  scene: Scene; renderer: ThreeRenderer; options?: TopBarOptions; theme?: Theme; className?: string; style?: CSSProperties;
}) {
  const host = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(options ?? {});
  useEffect(() => {
    const bar = viewerToolbar(scene, renderer, { ...options, theme });
    host.current?.appendChild(bar.el);
    return () => bar.dispose();
    // options compared by value (key), not by identity: a fresh object each render is no change
  }, [scene, renderer, theme, key]);
  return <div ref={host} className={className} style={{ display: "flex", alignItems: "center", ...style }} />;
}
