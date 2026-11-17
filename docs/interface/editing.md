# Selecting, editing, telling Claude

In apps that edit a model (built with `appShell` and a [`Doc`](/buildings/doc)), you select parts, change them, undo, and leave notes on the model for Claude or a colleague.

## Selecting

![Two blocks selected in the Site Editor](/shots/ui-selection.webp)

- **Click** a part: it is selected, and lit up wherever it is drawn: in 3D, in a [drawing](/drawings/sheet-canvas), in a list.
- **Shift-, ⌘- or Ctrl-click** adds a part to the selection, or takes it out.
- **Click empty space** to clear the selection.

What is selected is a *record* (a wall, a block, a stair), not a triangle: select a wall and its framing, its sheathing and its windows light up with it.

## Moving and changing

![A move handle on a selected object](/shots/ui-gizmo.webp)

Some apps put handles on what is selected: drag an arrow to move along it, a square to move in a plane, a ring to turn. The controls on the left change what is selected; the status line says what the change did.

**Keys belong to the app**: each app says what its keys do, so they never clash with a browser's. The Site Editor and the House use the usual ones:

| Key | |
|---|---|
| ⌘Z / Ctrl+Z | Undo |
| ⇧⌘Z, ⌘Y | Redo |
| ⌘D | Duplicate (Site Editor) |
| Delete, Backspace | Delete (Site Editor) |
| Arrow keys | Move the selection (Site Editor) |

Every edit is one undo step, whoever made it: you, a script, or Claude.

## Markup: draw what to change

![Two marks on the house, each with its instruction](/shots/ui-markup.webp)

**✎ Markup** turns the view into a sheet to draw on.

1. **Drag** around what you mean: a window, a roof edge. Each mark gets a number.
2. **Type** what to change in the box beside the mark, and press Enter. **Shift**-drag adds strokes to the last mark.
3. **Save** (⌘S) keeps the view with the marks and a file that says, for each mark, which parts it touches. In the House, **Keep as notes** keeps the marks with the model as notes.
4. **Undo** (⌘Z) takes back the last mark, **Clear** all of them. **Done** closes Markup.

A mark is not a picture of a circle: tekto works out which records it encloses (`walls/s`, `openings/ew1`) and where in space it lies, so Claude reads exactly what you pointed at.

## Notes

A note stays with the model: saved with it, undone like an edit, seen by everyone on a [shared model](/collaboration/shared-editing). It shows as a numbered pin. Click a pin to read the note and its replies, **Go to view** to see it from where it was drawn, **Reopen** a note marked done.

Open notes are Claude's to-do list: it reads them, makes the change, and answers on the note. See [Markup and notes](/collaboration/notes) and [the MCP server](/claude/mcp).

## The steps panel

In apps that record their steps, **Steps** at the bottom of the view opens the program as a graph of what it did, left to right. Click a step: its inputs, output and time, and the geometry it made lights up in the view. Write a note on a step for Claude, and **Save for agent**. See [Steps](/claude/steps).

## The drawing view

A [drawing](/drawings/sheet-canvas) over the view works like a sheet of paper: **scroll** zooms about the pointer, **drag** pans, **double-click** fits the drawing, **click** selects the part a line belongs to, the same selection as in 3D.
