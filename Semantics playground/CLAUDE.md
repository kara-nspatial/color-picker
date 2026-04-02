# Semantics Playground

A spatial/semantic viewer prototype — a Mapbox + Three.js web app for visualising and interacting with 3D building models overlaid on a map. Originally exported from a Figma design.

Figma source: https://www.figma.com/design/jXLOnzX4JgV2l19hasIZPT/Semantics-playground

## Tech Stack

- **React + TypeScript**, Vite
- **Mapbox GL JS** — base map (streets / satellite / hidden modes)
- **Three.js** — custom WebGL layer for 3D model rendering
- **shadcn/ui** components (Tailwind-based)
- Located in `Semantics playground/`

## What's Built

**Map & 3D layer**
- Mapbox map initialised at a fixed site (San Francisco), pitch 45°
- Custom Three.js layer renders a procedural office scene by default
- Optional GLB model auto-loaded from `/public/model.glb` if present (with progress overlay)
- Street / satellite / hidden map view toggle

**Toolbar tools (bottom centre)**
- Select tool — element mode (click to select chair/desk/monitor) and boundary mode (drag a rectangle)
- Measure tool — distance measurements with labels rendered per-frame via direct DOM refs
- Georeference tool — drag-to-reposition model with opacity control, save/cancel
- Search tool (visual search panel)
- Annotation, Download, Semantics (stubs — console.log only)

**Panels (right side)**
- `SelectionInfoPanel` — shows selected object details, "find all in scene" count
- `BoundaryResultsPanel` — lists objects inside a drag-selected region
- `MeasurementsPanel` — rename, view, delete measurements; metric/imperial toggle; "always visible" pin
- `VisualSearchPanel`

**Other**
- `SiteNamePanel` — upper-left site label
- `PrototypeMenu` — dev toggle panel to show/hide individual toolbar items and move the view switcher
- `MapControls` — zoom/compass + optional view switcher

## Running

```
npm i
npm run dev
```

## Search Tool — Current State

The search panel (`SearchChatPanel.tsx`) has two modes toggled via Prototype Settings:
- **Toolbar locked** — compact bar anchored above the toolbar, same width
- **Floating panel** — draggable panel, renders via React portal so it sits above the map

Both modes are UI/prototype only — search results are hardcoded ("Herman Miller Aeron Chair ×6, 91% match"). Nothing is wired to the actual 3D scene yet.

## Next Steps

- **Continue work on search tool** — next session pick up here
- Wire text search to actually query/highlight objects in the 3D scene
- Wire image search to real visual search logic
- Implement Annotation tool (currently a stub)
- Implement Semantics tool (currently a stub)
- Wire Download tool to export data or screenshots
