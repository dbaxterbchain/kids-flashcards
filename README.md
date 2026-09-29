# Kids Flashcards

A kid-friendly React + TypeScript web app for building, flipping, and hearing personalized flashcards. Add your own pictures, colors, and audio, then install it as a PWA so little learners can use it offline.

## Features
- Create, edit, and delete cards with custom images or solid-color fronts.
- Optional audio on each card (record in-app or upload); audio plays on flip with mute/play controls.
- Organize cards into sets, quickly show/hide sets, and toggle edit/delete buttons for kid-safe browsing.
- Smooth 3D flip animation and responsive MUI layout designed for tablets and laptops.
- Practice for each child: a profile per child (name, animal avatar, age-based settings) with separate spaced-repetition progress.
- Audio-first practice game for pre-readers: words are read aloud (your recording, or the device's voice), wrong taps get another try, and rounds end with a celebration.
- Offline-ready PWA with install prompt; cards, sets, children, and progress persist locally in IndexedDB.

## Getting Started

### Prerequisites
- Node.js 18+ (Node 22 works great)
- npm 9+ (pnpm/yarn also fine if you prefer)

### Install
```bash
npm install
```

### Run locally
```bash
npm run dev
```
The Vite dev server starts at `http://localhost:5173` with hot reload.

### Build and preview
```bash
npm run build
npm run preview
```

### Lint
```bash
npm run lint
```

## Usage
1. Start the dev server and open the app.
2. Click **New card** to open the card form.
3. Enter a card name, upload an image or pick a background color, and optionally record/upload audio (up to 10s).
4. Add the card to one or more sets, or create a new set on the fly.
5. Flip cards by clicking or pressing Space/Enter; use the gallery controls to show/hide sets and toggle action buttons.
6. Under **Practice**, add each child, pick who's playing, and press **Start**. The settings button next to Start changes their question type, number of choices, round length, and sets.

## Project Structure
```
src/
  App.tsx
  audio/            // Read-aloud and sound effects for practice
  components/       // Header, card form, grid, controls, practice, child settings, PWA prompts
  db/               // IndexedDB helpers for cards/sets and for children/progress
  flashcards/       // Types, storage, defaults, spaced repetition, practice rounds
  hooks/            // Audio recorder, child profiles, PWA hooks
  styles/           // Global styles
public/
  manifest.webmanifest, icons, assets
```

## PWA & Storage Notes
- The app registers a service worker (via `vite-plugin-pwa`) so you can install it and use cached cards offline.
- Cards and sets are stored locally in IndexedDB; clearing site data will reset to the starter deck.
- Children and their practice progress live in a separate IndexedDB database (`kids-flashcards-progress`), so each child's progress stays separate. Nothing is uploaded.

Enjoy helping kids learn with custom, colorful flashcards!
