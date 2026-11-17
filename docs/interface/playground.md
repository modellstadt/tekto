# The playground

The playground is tekto's apps in one page: 36 of them, from a single sphere to a house built from records. It is the quickest way to see what tekto does, and the place to try a change before it goes into an app.

<Live />

## On this site, and on your machine

**On this site** every page runs in your browser: turn and cut the model, change the light, move the sliders, export. A docs page about one of them shows it with **▶ Run it here**, which opens the app over the page, and **Open live**, which opens it in a tab of its own. In the playground, **Docs** and **Source** lead back to the page about it and to its code.

**On your machine** the same pages run from a clone, with what needs the dev server: ✎ Markup saves your marks to `.tekto/markup/` where Claude reads them (on this site it downloads the files instead), `npm run snap` captures a view for Claude, shared editing works, and a page reloads when its file changes. This is where you work with Claude.

```sh
npm run playground   # in a clone of tekto
```

![The playground with its top bar numbered](/shots/ui-playground.webp)

1. **Page**: pick an app. The address follows (`?page=timber`), so a link opens the same app.
2. **Render**: Solid, Wireframe, Hidden line or Ghost, for the page's view.
3. **Cut**: a section through the model.
4. **Light**: Flat or Studio.
5. **Sun**: the sun for a date and a place, and Studio's light follows it.
6. **Export** and **Import**: what the app can write (OBJ, IFC, DXF, …) or read, when it can.

Next to the page chooser, **Docs** opens the page about this app and **Source** its file.

The left side and the view are the app's own, as in any [tekto app](/interface/tour).

## Pages worth opening first

| Page | What it shows |
|---|---|
| <Live page="house" label="House" link /> | A two-storey house from records: framing, rooms, a timber stair, notes, IFC |
| <Live page="framed-floor" label="Framed Floor" link /> | A joisted floor over a stair: its well framed; timber, steel or concrete |
| <Live page="drawing-sheet" label="Drawing Sheet" link /> | A plan, elevations and a detail with a title block; SVG and DXF |
| <Live page="sketch-drawing" label="Sketch + drawing" link /> | A stair as a model and as a plan and section, from the same numbers |
| <Live page="nurbs-surfaces" label="NURBS Surfaces" link /> | A NURBS column, its ribs and its shell |
| <Live page="steps" label="Steps" link /> | A program shown as the graph of its steps |
| <Live page="site-editor" label="Site Editor" link /> | A model you edit: select, move, undo, save |
| `shared-editing` | Two windows editing the same model (from a clone) |

Each page is one file in `playground/pages/`: open it next to the running page to see how it is made.
