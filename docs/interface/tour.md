# A tekto app

Every tekto app has the same parts in the same places, whether Claude wrote it this morning or it ships in the playground. Learn them once and every app reads the same. Open the app below next to this page and find each part.

<Live page="framed-floor" label="Framed Floor" />

![The Framed Floor app with its parts numbered](/shots/ui-tour.webp)

1. **Page chooser** (playground only): switch between the playground's apps.
2. **The app's name**. **LIVE** means the model is rebuilt as you change a control.
3. **The app's top bar**: lighting (Flat or Studio, ambient occlusion), render mode, camera, section and sun. See [Looking at the model](/interface/view#the-app-s-top-bar).
4. **A group of controls**. Click its title to fold it away.
5. **A slider**: drag it, and the model rebuilds while you drag.
6. **A choice**: here the stair's shape.
7. **A switch**: here the sheathing and ceiling, on or off.
8. **A button**: does one thing now, here the IFC export.
9. **The shading bar**, inside the view: render modes, light, sun, section, overlays, frame and snapshot. See [Looking at the model](/interface/view#the-shading-bar).
10. **The model**. Drag to turn it, scroll to zoom; click a part to select it (in apps that edit).
11. **A callout**: a label with a leader to the parts it names, here one per kind of member.
12. **✎ Markup**: draw on the view to tell Claude, or a colleague, what to change. See [Telling Claude what to change](/interface/editing#markup-draw-what-to-change).
13. **The orbit gizmo**: click an axis to look along it; under it, perspective or orthographic.
14. **The status line**: what the app reports (here the members and the risers). Its button folds it to an ⓘ.

## Where things are

- **Left**: what you can change. Every control is a parameter of the model, named in the units it uses.
- **Top**: how you look at it. Nothing there changes the model.
- **In the view**: the model, and the tools that act on the view itself (shading bar, gizmo, Markup).
- **Bottom**: what the app tells you (status line), and in apps that record their steps, the [steps panel](/interface/editing#the-steps-panel).

An app shows only what it uses: an app without editing has no selection, one without steps no steps panel, a 2D app no gizmo.

::: tip Playground
Every app in the [playground](/interface/playground) is built this way. Run `npm run playground` and open `?page=framed-floor` for the app above.
:::
