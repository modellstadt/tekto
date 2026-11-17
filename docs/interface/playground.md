# The playground

The playground is tekto's apps in one page: 36 of them, from a single sphere to a house built from records. It is the quickest way to see what tekto does, and the place to try a change before it goes into an app.

```sh
npm run playground          # in a clone of tekto, then open the address it prints
```

![The playground with its top bar numbered](/shots/ui-playground.webp)

1. **Page**: pick an app. The address follows (`?page=timber`), so a link opens the same app.
2. **Render**: Solid, Wireframe, Hidden line or Ghost, for the page's view.
3. **Cut**: a section through the model.
4. **Light**: Flat or Studio.
5. **Sun**: the sun for a date and a place, and Studio's light follows it.
6. **Export** and **Import**: what the app can write (OBJ, IFC, DXF, …) or read, when it can.

The left side and the view are the app's own, as in any [tekto app](/interface/tour).

## Pages worth opening first

| Page | What it shows |
|---|---|
| `house` | A two-storey house from records: framing, rooms, a timber stair, notes, IFC |
| `framed-floor` | A joisted floor over a stair: its well framed; timber, steel or concrete |
| `drawing-sheet` | A plan, elevations and a detail with a title block; SVG and DXF |
| `sketch-drawing` | A stair as a model and as a plan and section, from the same numbers |
| `nurbs-surfaces` | A NURBS column, its ribs and its shell |
| `steps` | A program shown as the graph of its steps |
| `site-editor` | A model you edit: select, move, undo, save |
| `shared-editing` | Two windows editing the same model |

Each page is one file in `playground/pages/`: open it next to the running page to see how it is made.
