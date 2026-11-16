# COS — City of Shadows

An original African open-world 3D action-adventure game.

## Current milestone

This repository currently contains the first technical foundation:

- Three.js for real-time 3D rendering
- Vite for local development and production builds
- A lightweight night-time starter-district blockout
- Mouse, touch and trackpad camera orbit/zoom controls
- Responsive viewport and conservative rendering defaults
- Landscape-first presentation, with a rotate-device prompt on portrait mobile screens

The current city is placeholder geometry. It is not the finished game world, and there are no playable characters or missions yet.

## Orientation

COS is designed to be played horizontally (landscape) on Android and Windows. The browser preview displays a rotate-device prompt on portrait mobile screens. When the Android app package is introduced, its native configuration will also be set to landscape orientation; browser pages cannot reliably force a phone's orientation.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser with WebGL support

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

## Create a production build

```bash
npm run build
npm run preview
```

The production output is written to `dist/`. Do not commit `node_modules/` or `dist/`.

## Performance approach

COS is being developed for modest Windows and Android hardware. The initial renderer disables real-time shadows, caps pixel ratio, and uses a deliberately small blockout scene. Performance and WebGL compatibility must be tested on the actual target devices before increasing visual complexity.

## Planned modules

The project will grow in stages: core game systems, player characters, world, vehicles, pedestrians and police, missions, progression, controls, interface and audio. Modules will be added when their first implementation is ready rather than creating empty placeholder files.
