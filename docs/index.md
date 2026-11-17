---
layout: home

hero:
  name: tekto
  text: AI-first CAD experiments
  tagline: "Describe a building, a structure or a form to Claude. It writes a tekto app you can turn, cut, draw and edit, and you point at what to change. From Digital Building Technologies, ETH Zurich."
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Open the playground
      link: /play/
      target: _blank
    - theme: alt
      text: Tour an app
      link: /interface/tour
    - theme: alt
      text: GitHub
      link: https://github.com/dbt-ethz/tekto

features:
  - title: A building is data
    details: "Storeys, walls, openings, slabs, rooms, roofs and stairs as plain records. tekto builds them into timber framing, checks them and writes IFC. Claude edits the records; every edit is one undo step."
    link: /buildings/records
  - title: Point, and Claude changes it
    details: "Draw on the view, and each mark knows which walls and windows it means. Notes stay with the model as Claude's to-do list; it answers on the note."
    link: /interface/editing
  - title: Drawings from the model
    details: "Plans, sections and details at a scale, with a title block, from the same numbers as the 3D view. The screen, the SVG and the DXF draw the same lines."
    link: /drawings/sheet
  - title: Geometry for design research
    details: "One Mesh for editing and rendering, booleans, NURBS, curvature and streamlines, Voronoi, packing, 2D polygons."
    link: /geometry/mesh
  - title: A viewer for buildings
    details: "Hidden line, ghost, Studio light with a sun, sections by storey, callouts with leaders, a snapshot Claude can look at."
    link: /interface/view
  - title: One function, one app
    details: "sketch() turns a function into an app with sliders; appShell() into one people edit, undo and save. The playground holds 36 of them."
    link: /interface/playground
---

<script setup>
import { withBase } from "vitepress";
</script>

<div class="showcase">

<a href="./buildings/house"><img :src="withBase('/shots/house-framing.webp')" alt="A two-storey house, its timber frame drawn in lines"><span>A house from records, framed</span></a>
<a href="./buildings/stairs"><img :src="withBase('/shots/stair-timber.webp')" alt="A timber stair, the floor above cut away"><span>Stairs: timber, steel, concrete</span></a>
<a href="./drawings/sheet"><img :src="withBase('/shots/drawing-sheet.webp')" alt="A plan, elevations and a detail with a title block"><span>A drawing sheet with its title block</span></a>
<a href="./curves/nurbs"><img :src="withBase('/shots/nurbs.webp')" alt="A NURBS column and its ribs"><span>A NURBS column</span></a>
<a href="./buildings/house"><img :src="withBase('/shots/house-plan-cut.webp')" alt="The house cut above its ground floor"><span>Cut by storey</span></a>
<a href="./curves/streamlines"><img :src="withBase('/shots/streamlines.webp')" alt="Streamlines following the curvature of a surface"><span>Streamlines on a surface</span></a>

</div>
