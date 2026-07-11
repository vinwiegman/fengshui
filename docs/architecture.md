# Architecture

RoomRead is currently a client-only Expo proof of concept. It is designed so the demo works without external accounts, model weights, or backend infrastructure.

## Current App

```text
Expo mobile app
  ├── Photo picker
  ├── Multi-photo room coverage state
  ├── Simulated AI loading state
  ├── Fake annotated photo overlay
  ├── Editable inventory state
  ├── Detection confidence and zone metadata
  ├── Constraint state
  ├── Goal selection
  ├── Heuristic room analysis
  ├── Current vs optimized top-down layout map
  ├── Heuristic rearrangement plan
  └── Shareable summary export
```

The current recommendation engine is deterministic JavaScript inside `App.js`. It reads:

- inventory objects;
- object movability;
- selected user goal;
- enabled constraints.

It outputs five structured actions such as `group`, `align`, `rotate`, `clear surface`, and `validate`.

## Intended Production Architecture

```text
Expo mobile app
  ↓
Backend API
  ├── image quality checks
  ├── vision-model room analysis
  ├── structured inventory extraction
  ├── clutter/problem detection
  ├── recommendation generation
  └── plan validation
  ↓
Database and object storage
```

## AI Boundaries

The POC deliberately does not pretend to run computer vision locally. A production version should add:

- object detection for furniture and clutter;
- segmentation masks;
- room style classification;
- spatial relationship extraction;
- layout scoring;
- optional image-editing visualization.

The app should continue to let users edit AI outputs, because room photos are ambiguous and recommendations should stay grounded in user-confirmed objects.
