# Kids Flashcards

A kid-friendly React + TypeScript web app for building, flipping, and hearing personalized flashcards. Add your own pictures, colors, and audio, then install it as a PWA so little learners can use it offline.

## Features
- Create, edit, and delete cards with a photo (taken in the app or chosen from your library, and shrunk automatically), a solid color, or text such as "2 + 3" on the front.
- Optional audio on each card (record in-app or upload). It plays when the card flips; cards without a recording are read aloud by the device's voice (this can be switched off).
- A kid-friendly Play mode: big set tiles, two cards per row on phones, and the word said aloud when a card flips.
- A Grown-ups area behind a simple parent gate (a multiplication question) for adding, editing, and deleting cards, managing sets (rename, delete, hide from kids), and setting up each child. Deleting a card can be undone.
- Smooth 3D flip animation and responsive MUI layout designed for tablets and laptops.
- Practice for each child: a profile per child (name, animal avatar, age-based settings) with separate spaced-repetition progress.
- Audio-first practice game for pre-readers: words are read aloud (your recording, or the device's voice), wrong taps get another try, and rounds end with a celebration.
- Offline-ready PWA with install prompt; cards, sets, children, and progress persist locally in IndexedDB.
- Backup and restore: save everything (pictures, recordings, children, and progress included) to a single file, then restore it on this device or a new one.

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
2. Kids tap a set, then tap cards to flip them (Space/Enter works too).
3. Grown-ups tap the lock button and answer the question to open the Grown-ups area.
4. Under **Cards**, click **New card**: choose the front (a photo, a color, or text), type the word for the back, optionally record your voice saying it (up to 10s), and pick its sets.
5. Under **Sets**, rename or delete sets, or switch a set off to hide it from kids.
6. Under **Children**, add each child and choose their question type, number of choices, round length, and sets.
7. Back in Play mode, pick who's practicing and press **Start**, or open a set and press **Practice** to practice just that set.

## Project Structure
```
src/
  App.tsx
  audio/            // Read-aloud and sound effects
  components/       // Header, card editor, set tiles, card grid, practice, Grown-ups area, child settings, PWA prompts
  db/               // IndexedDB helpers for cards/sets and for children/progress
  flashcards/       // Types, storage, defaults, spaced repetition, practice rounds
  hooks/            // Card library, child profiles, routing, audio recorder, PWA hooks
  styles/           // Global styles
public/
  manifest.webmanifest, icons, assets
```

## PWA & Storage Notes
- The app registers a service worker (via `vite-plugin-pwa`) so you can install it and use cached cards offline.
- Cards and sets are stored locally in IndexedDB; clearing site data will reset to the starter deck.
- Children and their practice progress live in a separate IndexedDB database (`kids-flashcards-progress`), so each child's progress stays separate. Nothing is uploaded.
- Because everything stays on the device, clearing site data or losing the device loses it. Grown-ups › Settings › **Save a backup** writes a JSON file (shared via the share sheet on phones and tablets, downloaded elsewhere), and **Restore from a backup** replaces everything on the device with a backup's contents. Imported files are checked, and only embedded pictures and recordings, plain colors, and known fields are kept.

Enjoy helping kids learn with custom, colorful flashcards!
