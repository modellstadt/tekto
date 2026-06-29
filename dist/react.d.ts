import React, { CSSProperties, ReactNode } from 'react';
import { q as ParamStore, o as ParamLayout, S as Scene, p as ParamSchema, u as SceneObject } from './Params-c5RUx8In.js';

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

export { InspectorPanel, ParamPanel, TektoApp, Toolbar, type ToolbarAction, useParams, useScene, useSceneObjects, useSelection };
