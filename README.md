# RoomRead

RoomRead is a mobile proof of concept for a zero-budget interior redesign assistant. A user uploads room photos, reviews an editable room inventory, chooses a redesign goal, and receives an optimized top-down layout map plus a constrained rearrangement plan that uses only existing items.

This repository is intentionally scoped as a polished POC: it demonstrates the mobile product flow and recommendation model, while clearly marking the computer-vision and image-generation pieces that would be connected in a production version.

## Demo Flow

1. Open the app in Expo Go.
2. Upload or select bedroom/student-room photos.
3. Review the draft inventory.
4. Add or rename furniture and clutter items.
5. Toggle hard constraints such as `no purchases` or `do not block door`.
6. Choose a redesign goal.
7. Review the optimized layout map, zero-budget rearrangement plan, and before/after score.

## Features

- Expo SDK 54 React Native app for iOS and Android.
- Mobile-first interface with five guided screens: Photos, Items, Read, Layout, Export.
- Photo picker using `expo-image-picker`.
- Multi-photo room coverage flow for doorway, wall, and floor-path angles.
- Simulated AI analysis loading state after selecting a room photo.
- Fake annotated photo overlay with detection boxes and planning arrows.
- Optimized top-down room map showing current vs proposed layout.
- Editable detected-object cards with confidence labels and room zones.
- Constraint toggles for zero-budget planning.
- Goal-based recommendation logic.
- Room category, clutter, calm, and walking-flow scoring.
- Shareable/exportable redesign summary screen.
- POC disclaimers for unsupported AI components.
- pnpm-compatible local `index.js` entrypoint.

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- pnpm
- Expo Go for local mobile testing

## Web Client — Roomshift (`web/`)

Alongside the mobile POC, [`web/`](web) contains **Roomshift**, a browser-based floor-plan
editor and real spatial optimizer built on a shared room JSON schema
([`web/schemas/room-schema.json`](web/schemas/room-schema.json)):

- editable top-down SVG floor plan with drag-and-drop furniture and live constraint
  warnings (overlaps, out-of-bounds, blocked doors);
- a simulated-annealing layout optimizer with hard geometric constraints and
  measurable objectives (open space, walking paths, wall alignment, functional relations,
  movement cost);
- three generated layout alternatives with before/after comparison, movement arrows and
  rule-based explanations derived from measured layout diffs.

```bash
cd web
npm install
npm run dev   # http://localhost:5173
```

See [`web/README.md`](web/README.md) for the full write-up of the constraint engine and
objective terms.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start Expo:

```bash
pnpm start
```

Open the QR code with Expo Go.

## Useful Commands

```bash
pnpm check
pnpm export:android
pnpm start -- --clear
```

## Current POC Scope

RoomRead currently proves:

- the mobile app UX;
- the project structure;
- the zero-budget redesign identity;
- editable inventory and constraints;
- simulated AI analysis, annotated photo feedback, and optimized layout map;
- deterministic recommendation generation;
- final summary export/share flow;
- Expo Go compatibility.

It does not yet perform real computer vision. Object detection, segmentation, depth estimation, and AI image editing require model weights or external APIs.

## Product Roadmap

1. Connect photo upload to a backend analysis endpoint.
2. Use a vision-capable model to return structured room inventory JSON.
3. Replace seeded inventory with AI-generated editable inventory.
4. Add validation for hard constraints and impossible placements.
5. Add annotated image overlays and/or a simple 2D layout board.
6. Add account/project storage when repeated room projects matter.

## Repository Structure

```text
.
├── App.js
├── index.js
├── app.json
├── package.json
├── pnpm-lock.yaml
├── docs/
│   ├── architecture.md
│   ├── demo-script.md
│   └── roadmap.md
├── web/                  # Roomshift web client + layout optimizer (Vite + React)
│   ├── src/engine/       # geometry, constraints, objectives, simulated annealing
│   ├── src/components/   # SVG floor-plan editor, inspector, results panel
│   ├── schemas/          # shared room JSON schema
│   └── sample-data/      # importable sample rooms
└── README.md
```

## Status

Finished proof-of-concept. Ready to demo as a mobile app project, not yet a production AI system.
