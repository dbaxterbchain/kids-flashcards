// Takes the screenshots shown when installing the app. Start the app first (npm run dev), then:
//
//   npm run brand:screenshots
//
// APP_URL points somewhere else (default http://localhost:5173/). FONT_DIR works as in build.mjs.
import { chromium } from '@playwright/test';
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { fontCss } from './fonts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../../public/screenshots');
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173/';
mkdirSync(OUT, { recursive: true });

async function open(name, viewport, deviceScaleFactor) {
  const profile = join(tmpdir(), `kids-flashcards-${name}`);
  rmSync(profile, { recursive: true, force: true });
  const context = await chromium.launchPersistentContext(profile, { viewport, deviceScaleFactor });
  if (process.env.FONT_DIR) {
    await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: fontCss() }));
  }
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  return { context, page };
}

// A child and a few library sets, so the screens look like a family's.
async function setUp(page) {
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open('kids-flashcards-progress');
        request.onsuccess = () => {
          const transaction = request.result.transaction('profiles', 'readwrite');
          transaction.objectStore('profiles').put({
            id: 'screenshots',
            name: 'Maya',
            avatar: '🦊',
            createdAt: Date.now(),
            settings: {
              setIds: null,
              choiceCount: 3,
              promptMode: 'find-picture',
              roundSize: 10,
              readAloud: true,
              soundEffects: true,
              introduceNew: true,
              autoAdjust: true,
            },
          });
          transaction.oncomplete = () => {
            request.result.close();
            resolve();
          };
        };
      }),
  );
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Grown-ups' }).click();
  const gate = page.getByRole('dialog');
  const [, a, b] = (await gate.getByText(/What is \d+ × \d+\?/).innerText()).match(/(\d+) × (\d+)/);
  await gate.getByLabel('Answer').fill(String(Number(a) * Number(b)));
  await gate.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('tab', { name: 'Sets' }).click();
  await page.getByRole('button', { name: 'Set library' }).click();
  const library = page.getByRole('dialog');
  for (const name of ['Farm animals', 'The planets', 'Feelings', 'Fruits']) {
    await library.getByRole('button', { name: `Add ${name}` }).click();
    await library.getByRole('button', { name: `${name} added` }).waitFor();
  }
  await library.getByRole('button', { name: 'Close the library' }).click();
  await page.locator('.MuiDialog-root').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('heading', { name: 'What shall we learn?' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

const save = (page, file) => page.screenshot({ path: join(OUT, file), type: 'jpeg', quality: 82 });

// Phones: the home screen, and a set with a card flipped over.
{
  const { context, page } = await open('screenshots-narrow', { width: 390, height: 844 }, 2);
  await setUp(page);
  await save(page, 'home-narrow.jpg');
  await page.locator('.set-tile', { hasText: 'The planets' }).click();
  await page.getByRole('button', { name: 'Flashcard for Earth' }).waitFor();
  await page.getByRole('button', { name: 'Flashcard for Mercury' }).click();
  await page.waitForTimeout(900);
  await save(page, 'set-narrow.jpg');
  await context.close();
}
// Computers and tablets.
{
  const { context, page } = await open('screenshots-wide', { width: 1280, height: 800 }, 1);
  await setUp(page);
  await save(page, 'home-wide.jpg');
  await context.close();
}
console.log('Wrote public/screenshots/*.jpg');
