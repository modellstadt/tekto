# Looking at the model

Turning, zooming, cutting and lighting change how you see the model, never the model itself.

## Moving around

| | Mouse or trackpad | Touch screen |
|---|---|---|
| Turn (orbit) | drag (left button) | drag with one finger |
| Move along (pan) | right-drag (two-finger click on a trackpad) | drag with two fingers |
| Zoom | scroll (two fingers on a trackpad), or middle-drag | pinch |
| Frame everything | the frame button on the shading bar | the same |

The view glides to a stop after a drag. Where the view has a **hand** button and zoom buttons (2D views, and beside the gizmo in some apps), the hand makes a drag move the view instead of turning it, until you click it again.

## The orbit gizmo

![The orbit gizmo in the corner of a view](/shots/ui-gizmo.webp)

The axes in the corner are the model's own: X red, Y green, Z blue.

- **Click an axis** to look along it: the top view, a front or a side view.
- **Drag on the gizmo** to turn the view, as on the model.
- **Double-click** to snap to the axis the view is nearest.
- **PERSP / ORTHO** under it switches perspective and orthographic. An elevation or a plan is the orthographic one.

![The house from above, orthographic, cut at 1.2 m: a plan](/shots/ui-plan-view.webp)

Top view, orthographic, and a cut a little above the floor is a plan.

## The shading bar

![The shading bar, numbered](/shots/ui-shading-bar.webp)

1. **Solid**: shaded surfaces.
2. **Wireframe**: every edge of every face.
3. **Hidden line**: black lines on white, edges behind surfaces left out, as a drawing.
4. **Ghost**: see-through, to see what is inside.
5. **Flat lighting**: quick, no shadows. For working.
6. **Studio lighting**: soft shadows, for looking.
7. **Ambient occlusion**: darker where surfaces meet (Solid, perspective).
8. **Sun**: morning, noon or sunset, and Studio's light follows it.
9. **Section**: cut the model (below).
10. **Overlays**: grid, axes, wireframe, labels, notes on or off.
11. **Frame**: fit the view to the selection, or to everything.
12. **Snapshot**: save the view as a PNG.

## Sections

![A plan section through the house, with its level buttons](/shots/ui-section.webp)

The section button opens the cut:

- **Off**, **Plan** (a horizontal cut), **X** or **Y**: which way to cut.
- **⇅** keeps the other side.
- The **slider** moves the cut through the model, in metres in a building app.
- In a building, a button per storey ("Ground floor", "Upper floor") cuts 1.2 m above that floor: a plan of it.

## The app's top bar

![The app's top bar: light, mode, camera, cut and sun](/shots/ui-app-toolbar.webp)

Apps built with `appShell` repeat the main view controls in a bar at the top, as words: **Light** (Flat, Studio, AO), **Mode** (Solid, Wire, Hidden, Ghost), **Cam** (Persp, Ortho, Iso: an orthographic view from the diagonal), **Cut** and **Sun**. The **Sun** popover places the sun for a site, a date and an hour, and Studio's light follows it.

## The status line

The line at the bottom of the view is what the app reports: counts, areas, issues found. Its button folds it to an ⓘ (hover it to read the line), and the app remembers that the next time.
