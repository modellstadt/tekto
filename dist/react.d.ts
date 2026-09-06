import React, { ReactNode, CSSProperties } from 'react';
import { P as ParamStore, q as ParamLayout, S as Scene, e as ParamSchema, u as SceneObject } from './Params-XUrkP8an.js';

/**
 * Tekto React Integration
 *
 * Components and hooks that wire the Scene, Renderer, and Params together.
 */

declare function useScene(): Scene;
declare function TektoApp({ scene: extScene, children, }: {
    scene?: Scene;
    children: ReactNode;
}): React.JSX.Element;
/** Reactively watch all scene objects */
declare function useSceneObjects(): SceneObject[];
/** Watch selection */
declare function useSelection(): {
    ids: string[];
    select: (id: string) => void;
    deselect: (id: string) => void;
    toggle: (id: string) => void;
    clear: () => void;
    isSelected: (id: string) => boolean;
};
/** Use a ParamStore reactively */
declare function useParams<S extends ParamSchema>(store: ParamStore<S>): {
    values: Record<string, any>;
    set: (key: string, value: any) => void;
    store: ParamStore<S>;
};
interface ParamPanelProps {
    store: ParamStore;
    layout?: ParamLayout;
    title?: string;
    style?: CSSProperties;
    className?: string;
}
declare function ParamPanel({ store, layout, title, style, className }: ParamPanelProps): React.JSX.Element;
declare function InspectorPanel({ style, className, onSelect, }: {
    style?: CSSProperties;
    className?: string;
    onSelect?: (id: string) => void;
}): React.JSX.Element;
interface ToolbarAction {
    key: string;
    label: string;
    icon?: string;
    shortcut?: string;
    onClick: () => void;
    active?: boolean;
    group?: string;
}
declare function Toolbar({ actions, style, className, }: {
    actions: ToolbarAction[];
    style?: CSSProperties;
    className?: string;
}): React.JSX.Element;
/**
 * One section of an AccordionColumn.
 *
 * `meta` is the part that earns a closed section its place on screen: a count,
 * a total, a setting. A header that says only "Cut list" is worth nothing shut;
 * one that says "Cut list, 94 pieces" answers the question most readers had.
 */
interface AccordionSection {
    id: string;
    title: string;
    /** Shown at the right of the header, whether the section is open or closed. */
    meta?: ReactNode;
    /**
     * The one section that takes whatever height is left and scrolls inside it.
     * Everything else is sized by its own body, or by a drag. At most one.
     */
    fill?: boolean;
    /** Open before the reader has an opinion. Defaults to true for `fill`. */
    defaultOpen?: boolean;
    /**
     * Body height in pixels when opened, which also makes the section draggable.
     * Leave it out and the body is as tall as its content, which is what prose
     * of unpredictable length wants: a supplier's note is three lines or thirty,
     * and pinning either to 220 pixels is wrong for the other.
     *
     * For the `fill` section it is read as a floor instead: open every other
     * section and the one that gives way must still be worth looking at, so past
     * that point the column scrolls rather than squeezing the tree to two rows.
     */
    defaultHeight?: number;
    /** Hover text on the header. */
    hint?: string;
    children: ReactNode;
}
interface AccordionColumnProps {
    sections: AccordionSection[];
    /** localStorage key for what is open and how tall. Omit to keep it per mount. */
    storageKey?: string;
    className?: string;
    /** The host decides how wide the column is, and where it sits. */
    style?: CSSProperties;
    /**
     * Class names for the parts, so the column takes the host's look rather than
     * bringing its own. The built-in styles are structural only: what is left if
     * you pass nothing is a plain, legible column, not a themed one.
     */
    classes?: Partial<Record<"header" | "title" | "meta" | "body" | "handle", string>>;
}
/**
 * A column of collapsible sections, one of which may take the leftover height.
 *
 * The pattern every inspector ends up with: a tree that should have all the
 * room going, and beneath it a few references (a cut list, a property bag, a
 * project setting) that are worth a line each until you want them. Doing it
 * ad hoc gives every section a slightly different header, a different way to
 * collapse, and a different answer to what happens when two are open at once.
 *
 * What it handles: the leftover-height section scrolls rather than pushing the
 * others off; an open section can be dragged taller, and the handle only exists
 * while there is something to drag; closed sections keep their headers, so the
 * column always reads as a table of contents; and the whole arrangement
 * persists, because a reader who opened something meant it.
 */
declare function AccordionColumn({ sections, storageKey, className, style, classes, }: AccordionColumnProps): React.JSX.Element;

export { AccordionColumn, type AccordionColumnProps, type AccordionSection, InspectorPanel, ParamPanel, TektoApp, Toolbar, type ToolbarAction, useParams, useScene, useSceneObjects, useSelection };
