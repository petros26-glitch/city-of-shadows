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
- Capacitor 8 configuration for packaging the existing web game as an Android app

The current city is placeholder geometry. It is not the finished game world, and there are no playable characters or missions yet.

## Orientation

COS is designed to be played horizontally (landscape) on Android and Windows. The browser preview displays a rotate-device prompt on portrait mobile screens. The Android build sets the native main activity to fixed landscape orientation, so the installed game can open horizontally even when Android Auto-rotate is turned off. The browser preview cannot override Android's system rotation lock.

## Android test build

GitHub Actions builds a debug APK when relevant game or Android packaging files change, and also supports a manual run from the Actions tab. Download the `COS-Android-debug-APK` artifact from a successful workflow run to test the installable Android build.

The Android project is generated during the workflow rather than checked into the repository at this early stage. This keeps the source repository lean while we validate the native wrapper and landscape behaviour.

For local Android development, install Node.js 22+, Android Studio and the Android SDK, then run:

```bash
npm install
npx cap add android
npm run android:prepare
npm run android:open
```

## Requirements

- Node.js 22+
- npm
- Android Studio and Android SDK for local Android builds
- A modern browser with WebGL support for the browser preview

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

## Create a production web build

```bash
npm run build
npm run preview
```

The production output is written to `dist/`. Do not commit `node_modules/` or `dist/`.

## Performance approach

COS is being developed for modest Windows and Android hardware. The initial renderer disables real-time shadows, caps pixel ratio, and uses a deliberately small blockout scene. Performance and WebGL compatibility must be tested on the actual target devices before increasing visual complexity.

## Planned modules

The project will grow in stages: core game systems, player characters, world, vehicles, pedestrians and police, missions, progression, controls, interface and audio. Modules will be added when their first implementation is ready rather than creating empty placeholder files.
