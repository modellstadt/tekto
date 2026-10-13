import { P as ParamStore, a as ParamLayout, b as ParamSchema, c as ParamValues } from './Params-op8yBPbB.mjs';
import React, { ReactNode, CSSProperties } from 'react';
import { S as Scene, a as SceneObject } from './Scene-CaG0H74_.mjs';

/**
 * The `Scene` of the enclosing `<TektoApp>`; throws outside one.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function useScene(): Scene;
/**
 * Provides a `Scene` (the one passed in, or a new one) to its children; `useScene` and the other hooks need it above them.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function TektoApp({ scene: extScene, children, }: {
    scene?: Scene;
    children: ReactNode;
}): React.JSX.Element;
/**
 * Reactively watch all scene objects
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function useSceneObjects(): SceneObject[];
/**
 * Watch selection
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function useSelection(): {
    ids: string[];
    select: (id: string) => void;
    deselect: (id: string) => void;
    toggle: (id: string) => void;
    clear: () => void;
    isSelected: (id: string) => boolean;
};
/**
 * Use a ParamStore reactively
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function useParams<S extends ParamSchema>(store: ParamStore<S>): {
    values: ParamValues<S>;
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
/**
 * A React panel generated from a `ParamStore`: one control per param, grouped into folders by an optional `ParamLayout`, kept in sync with the store.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function ParamPanel({ store, layout, title, style, className }: ParamPanelProps): React.JSX.Element;
/**
 * A list of the scene's objects (type, id, label); clicking one toggles its selection and calls `onSelect`.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function InspectorPanel({ style, className, onSelect, }: {
    style?: CSSProperties;
    className?: string;
    onSelect?: (id: string) => void;
}): React.JSX.Element;
/**
 * One `Toolbar` button: label, optional icon, click handler, `active` highlight and `group`; `shortcut` only appears in the tooltip.
 *
 * @experimental No app uses this yet; it may still change.
 */
interface ToolbarAction {
    key: string;
    label: string;
    icon?: string;
    shortcut?: string;
    onClick: () => void;
    active?: boolean;
    group?: string;
}
/**
 * A row of buttons with a divider between `group`s; `active` ones are highlighted. Shortcuts are shown in the tooltip, not bound.
 *
 * @experimental No app uses this yet; it may still change.
 */
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
 *
 * @experimental No app uses this yet; it may still change.
 */
interface AccordionSection {
    id: string;
    title: string;
    /** Shown at the right of the header, whether the section is open or closed. */
    meta?: ReactNode;
    /**
     * The section that takes whatever height is left, until a drag gives it one
     * of its own. At most one.
     */
    fill?: boolean;
    /** Open before the reader has an opinion. Defaults to true for `fill`. */
    defaultOpen?: boolean;
    /**
     * Body height in pixels when opened, which also makes the section resizable.
     * Leave it out and the body is as tall as its content, which is what prose
     * of unpredictable length wants: a supplier's note is three lines or thirty,
     * and pinning either to 220 pixels is wrong for the other.
     */
    defaultHeight?: number;
    /** Hover text on the header. */
    hint?: string;
    children: ReactNode;
}
/**
 * Props of `AccordionColumn`: its sections, the `localStorage` key for open state and heights, and class names for the host's styling.
 *
 * @experimental No app uses this yet; it may still change.
 */
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
    classes?: Partial<Record<"header" | "title" | "meta" | "body" | "handle" | "marker" | "info" | "hint", string>>;
}
/**
 * A column of collapsible sections, one of which may take the leftover height.
 *
 * The pattern every inspector ends up with: a tree that should have all the
 * room going, and beneath it a few references (a cut list, a property bag, a
 * project setting) that are worth a line each until you want them. Doing it ad
 * hoc gives every section a slightly different header, a different way to
 * collapse, and a different answer to what happens when two are open at once.
 *
 * **A boundary is a sash between its two neighbours**, which is the convention
 * and the only reading under which the rule follows the pointer. What the
 * section above gains, the section below gives up: the top of the one and the
 * bottom of the other stay put, and the line moves by exactly the distance
 * dragged. Resizing a single section instead looks right only while some other
 * section has slack to absorb the difference, and at its limit the line stops
 * dead while a different edge moves.
 *
 * The flexible section takes the leftover until a sash gives it a height of its
 * own; from then on it is a section like the others, which is what makes a
 * boundary stay where it was put.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function AccordionColumn({ sections, storageKey, className, style, classes, }: AccordionColumnProps): React.JSX.Element;
/**
 * A small circled i that explains something on hover or focus.
 *
 * For text that is about how the tool works rather than about the building:
 * the paragraph that used to sit under a heading, read once and then paid for
 * on every visit after. It is on the accordion headings by way of `hint`, and
 * exported so a host can put the same mark beside a label of its own.
 *
 * Shows on hover and on keyboard focus, and a click pins it until the next
 * click, so it works with a mouse, a keyboard and a finger. Positioned to the
 * right-bottom of the mark by default; a host that needs it elsewhere styles
 * the box.
 *
 * @experimental No app uses this yet; it may still change.
 */
declare function InfoHint({ text, className, boxClassName, label }: {
    text: ReactNode;
    className?: string;
    boxClassName?: string;
    label?: string;
}): React.JSX.Element;

export { AccordionColumn, type AccordionColumnProps, type AccordionSection, InfoHint, InspectorPanel, ParamPanel, TektoApp, Toolbar, type ToolbarAction, useParams, useScene, useSceneObjects, useSelection };
