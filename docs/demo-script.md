# Demo Script

Use this when presenting RoomRead as a proof of concept.

## Setup

1. Start the app with Expo.
2. Open it in Expo Go.
3. Have one bedroom or student-room photo ready on the phone.

## Talk Track

RoomRead is a zero-budget room redesign assistant. The key idea is that it should not immediately recommend buying new furniture. It first tries to understand what the user already owns and creates a rearrangement plan from those items.

## Walkthrough

1. Start on the Photo screen.
2. Upload/select a room photo.
3. Point out the simulated AI analysis loading state.
4. Show the fake detection boxes over the uploaded photo.
5. Move to Items.
6. Show editable detected-object cards, confidence labels, and room zones.
7. Toggle constraints like `no purchases`, `do not block door`, and `keep desk usable`.
8. Move to Read.
9. Show that the photo affects coverage, confidence, category, and scores.
10. Pick a goal such as `improve study space`.
11. Move to Plan.
12. Show the annotated arrows, structured actions, and before/after score.
13. Move to Export.
14. Share or preview the generated redesign summary.

## Important Framing

This is the finished proof of concept, not the full AI pipeline. The next build step is to connect real photo analysis so the inventory is generated from the uploaded image instead of seeded demo data.
