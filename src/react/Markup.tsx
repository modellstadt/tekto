// ✎ Markup as a React component: the overlay markup() mounts over the renderer's view, here
// for as long as the component is mounted. It renders nothing itself.
import { useEffect, useRef } from "react";
import type { Scene } from "../scene/Scene";
import { markup, type MarkupRenderer } from "../sketch/Markup";

/** ✎ Markup over a renderer's view while mounted (`markup()`): `<Markup scene={scene} renderer={renderer} title="7DHouse" />`. */
export function Markup({ scene, renderer, title, context }: {
  scene: Scene; renderer: MarkupRenderer; title?: string; context?: () => Record<string, unknown>;
}) {
  const ctx = useRef(context);
  ctx.current = context;
  useEffect(() => {
    const m = markup(renderer, scene, { title, context: () => ctx.current?.() ?? {} });
    return () => m.dispose();
  }, [scene, renderer, title]);
  return null;
}
