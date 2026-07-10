# RoomRead

RoomRead is an Expo React Native prototype for a zero-budget room redesign assistant.

## Run

```bash
npm install
npm start
```

Open the Expo QR code with Expo Go, or run it in an iOS/Android simulator.

On this machine, if `node` or `pnpm` is not on your PowerShell `PATH`, run:

```powershell
$env:Path = "C:\Users\vinwi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\vinwi\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;$env:Path"
pnpm start -- --port 8082
```

This project is on Expo SDK 54 so it opens in the current Expo Go app.

The app uses a local `index.js` entrypoint so Expo resolves `App.js` correctly when dependencies are installed with pnpm.

## Current MVP

- Upload a bedroom or student-room photo from the device library.
- Review editable draft room inventory.
- Toggle practical constraints.
- Pick a redesign goal.
- Generate a zero-purchase rearrangement plan.
- See room scores and feasibility notes.

## Not implemented locally

Real object detection, segmentation, depth estimation, and AI image editing still need model weights or external APIs. This app keeps those steps explicit instead of pretending they are running on-device.
