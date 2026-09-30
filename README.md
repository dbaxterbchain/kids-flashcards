# Kids Flashcards

A kid-friendly React + TypeScript web app for building, flipping, and hearing personalized flashcards. Add your own pictures, colors, and audio, then install it as a PWA so little learners can use it offline.

## Features
- Create, edit, and delete cards with a photo (taken in the app or chosen from your library, and shrunk automatically), a solid color, or text such as "2 + 3" on the front.
- Optional audio on each card (record in-app or upload). It plays when the card flips; cards without a recording are read aloud by the device's voice (this can be switched off), in the card's own language when one is chosen (for example Spanish or French).
- A set library with 61 ready-made sets for ages 2 and up: animals and animal sounds, everyday words, feelings, community helpers, science (weather, seasons, life cycles, parts of a plant, the human body, space, the planets, solid/liquid/gas, element symbols), math (teen numbers, 3D shapes, addition and subtraction, skip counting, telling time, times tables, fractions), reading (letters, first letters, opposites, sight words, days and months), Spanish and French words, flags of the world, computers (parts, coding words, binary), instruments and sports. Many cards come with talk-about-it questions.
- Optional talk-about-it questions on cards ("What sound does a dog make?"), shown on the back of the card and after a right answer.
- Share any set as a single file (pictures, recordings, colors, and languages included) and import sets others share, with a preview first. Installed on Android, the app appears in the share sheet for set files; on computers, set files can be opened with it.
- Print any set as two-sided flashcards, six to a page, with cut lines.
- A kid-friendly Play mode: big set tiles, two cards per row on phones, and the word said aloud when a card flips.
- A Grown-ups area behind a simple parent gate (a multiplication question) for adding, editing, and deleting cards, managing sets (rename, delete, hide from kids), and setting up each child. Deleting a card can be undone.
- Smooth 3D flip animation and responsive MUI layout designed for tablets and laptops.
- Practice for each child: a profile per child (name, an emoji avatar from themed groups or a photo, age-based settings) with separate spaced-repetition progress.
- Audio-first practice game for pre-readers: words are read aloud (your recording, or the device's voice), wrong taps get another try, and rounds end with a celebration.
- New cards are introduced (shown and said) before they're asked about, a few per round, and then asked with just two choices.
- The number of answer choices adjusts as each child improves or struggles (grown-ups are told, and can switch it off).
- Stickers for every finished round or game (shiny ones for perfect rounds), a sticker book for each child, and a gentle days-in-a-row streak.
- Games for each set: memory match, listen and find (sound only, for pre-readers), and odd one out.
- "Say it": kids record themselves saying a word and hear their voice next to yours. Nothing is saved.
- A progress view for grown-ups: each child's cards as mastered, learning, tricky or not started, set by set, with the tricky cards to look at together.
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

### Tests
```bash
npm test             # unit tests (Vitest)
npm run build        # the browser tests run against the production build
npx playwright install chromium   # once, to download the test browser
npm run test:e2e     # browser tests (Playwright) on a phone and a desktop
```
GitHub Actions runs lint, the unit tests, the build, and the browser tests on every pull request.

## Usage
1. Start the dev server and open the app.
2. Kids tap a set, then tap cards to flip them (Space/Enter works too).
3. Grown-ups tap the lock button and answer the question to open the Grown-ups area.
4. Under **Cards**, click **New card**: choose the front (a photo, a color, or text), type the word for the back, optionally record your voice saying it (up to 10s), and pick its sets.
5. Under **Sets**, open the **Set library** to add ready-made sets, **Import a set** someone shared with you, share a set with the share button, or rename, delete, or hide a set from kids. Deleting a set can also delete the cards that are only in it.
6. Under **Children**, add each child and choose their question type, number of choices, round length, and sets. **Progress** shows how each child is doing.
7. Back in Play mode, pick who's practicing and press **Start**, or open a set and press **Practice** to practice just that set, or play one of its games.
8. To print a set, open its menu under **Sets** and choose **Print**.

## Project Structure
```
src/
  App.tsx
  audio/            // Read-aloud and sound effects
  components/       // Header, card editor, set tiles, card grid, practice, Grown-ups area, child settings, PWA prompts
  db/               // IndexedDB helpers for cards/sets and for children/progress
  flashcards/       // Types, storage, starter cards, set library, backups and set files, spaced repetition, practice rounds (with unit tests)
  hooks/            // Card library, child profiles, routing, audio recorder, PWA hooks
  styles/           // Global styles
e2e/                // Browser tests (Playwright)
public/
  manifest.webmanifest, icons, assets
```

## PWA & Storage Notes
- The app registers a service worker (via `vite-plugin-pwa`) so you can install it and use cached cards offline.
- Cards and sets are stored locally in IndexedDB; clearing site data will reset to the starter deck.
- Children and their practice progress live in a separate IndexedDB database (`kids-flashcards-progress`), so each child's progress stays separate. Nothing is uploaded.
- Because everything stays on the device, clearing site data or losing the device loses it. Grown-ups › Settings › **Save a backup** writes a JSON file (shared via the share sheet on phones and tablets, downloaded elsewhere), and **Restore from a backup** replaces everything on the device with a backup's contents.
- A shared set is a smaller JSON file with one set's cards and no children or progress. Importing one always adds a new set and never changes existing cards.
- Backups and set files are checked when opened: only embedded pictures and recordings (never links), plain colors, language tags, and known fields are kept.
- The set library's pictures are emoji and small generated drawings, so the library is a small download that's only loaded when a grown-up opens it (and is cached for offline use).

## Roadmap
See [ROADMAP.md](ROADMAP.md) for what's been done and ideas for later.

Enjoy helping kids learn with custom, colorful flashcards!
