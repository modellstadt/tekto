---
layout: home

hero:
  name: tekto
  text: AI-first CAD experiments
  image:
    src: /shots/house.webp
    alt: A timber house built from records
  tagline: A computational geometry and CAD library from Digital Building Technologies, ETH Zurich. Describe a design to a coding agent, get an interactive app, point at what to change.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Why tekto
      link: /guide/why
    - theme: alt
      text: GitHub
      link: https://github.com/dbt-ethz/tekto

features:
  - title: One function, one app
    details: "sketch() turns a function into a 3D app with sliders. sketch2d() does the same for a 2D canvas, appShell() for an app people edit and save."
    link: /apps/sketch
  - title: Geometry
    details: "One Mesh class for editing and rendering, MeshFactory generators, booleans, NURBS, curvature, 2D polygons, Voronoi and packing."
    link: /geometry/mesh
  - title: Buildings as data
    details: "Storeys, walls, openings, slabs, rooms, roofs and stairs as JSON records, built into timber framing, checked by record, exported as IFC."
    link: /buildings/records
  - title: Drawings
    details: "A Sheet holds plans, elevations and details at a scale. The screen, the SVG and the DXF draw the same primitives."
    link: /drawings/sheet
  - title: A viewer for buildings
    details: "Hidden line, ghost, Studio light with a sun, ambient occlusion, sections with poché, callouts with leaders."
    link: /viewer/render-modes
  - title: Working with Claude
    details: "An MCP server reaches the app a person has open. Claude reads the records, applies patches, answers notes and looks at the result."
    link: /claude/mcp
---

<div class="gallery">

![A two-storey timber house](/shots/house.webp)
![The house with its framing](/shots/house-framing.webp)
![A plan cut through the house](/shots/house-plan-cut.webp)
![A NURBS column](/shots/nurbs.webp)
![Streamlines on a surface](/shots/streamlines.webp)
![A drawing sheet](/shots/drawing-sheet.webp)

</div>
