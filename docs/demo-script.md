# Demo Script

Use this when presenting RoomRead as a proof of concept.

## Setup

1. Start the app with Expo.
2. Open it in Expo Go.
3. Have a few bedroom or student-room photos ready on the phone.

## Talk Track

RoomRead is a zero-budget room redesign assistant. The key idea is that it should not immediately recommend buying new furniture. It first tries to understand what the user already owns and creates a rearrangement plan from those items.

## Walkthrough

1. Start on the Photo screen.
2. Upload/select a room photo.
3. Add another angle if available and point out the room coverage count.
4. Point out the simulated AI layout-analysis loading state.
5. Show the fake detection boxes over the uploaded photo.
6. Move to Items.
7. Show editable detected-object cards, confidence labels, and room zones.
8. Toggle constraints like `no purchases`, `do not block door`, and `keep desk usable`.
9. Move to Read.
10. Show that the photos affect coverage, confidence, category, and scores.
11. Pick a goal such as `improve study space`.
12. Move to Layout.
13. Show the current vs optimized top-down room map.
14. Show the annotated arrows, structured actions, and before/after score.
15. Move to Export.
16. Share or preview the generated redesign summary.

## Important Framing

This is the finished proof of concept, not the full AI pipeline. The next build step is to connect real photo analysis so the inventory is generated from the uploaded image instead of seeded demo data.
