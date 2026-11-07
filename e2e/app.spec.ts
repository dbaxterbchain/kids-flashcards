import { expect, Page, test } from '@playwright/test';
import { readFileSync } from 'fs';

/** Answers the grown-ups question to open Grown-ups mode. */
async function openGrownUps(page: Page) {
  await page.getByRole('button', { name: 'Grown-ups' }).click();
  const gate = page.getByRole('dialog');
  const question = await gate.getByText(/What is \d+ × \d+\?/).innerText();
  const [, a, b] = question.match(/(\d+) × (\d+)/) ?? [];
  await gate.getByLabel('Answer').fill(String(Number(a) * Number(b)));
  await gate.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Grown-ups', exact: true })).toBeVisible();
}

const setTile = (page: Page, name: string) => page.locator('.set-tile', { hasText: name });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Got it' }).click();
});

test('kids can open a set and flip a card', async ({ page }) => {
  await setTile(page, 'Numbers 0-10').click();
  const card = page.getByRole('button', { name: 'Flashcard for Three' });
  await card.click();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Back' }).first().click();
  await expect(page.getByRole('heading', { name: 'What shall we learn?' })).toBeVisible();
});

test('kids can play odd one out with a set', async ({ page }) => {
  const shapes = ['Circle', 'Square', 'Triangle', 'Rectangle', 'Star', 'Heart', 'Oval', 'Diamond', 'Pentagon', 'Hexagon'];
  await setTile(page, 'Shapes').click();
  await page.getByRole('button', { name: /Odd one out/ }).click();
  await expect(page.getByText("Which one doesn't belong?")).toBeVisible();
  for (let question = 1; question <= 6; question += 1) {
    await expect(page.getByText(`Question ${question} of 6`)).toBeVisible();
    const labels = await page.locator('.practice-options .practice-tile').evaluateAll((tiles) =>
      tiles.map((tile) => tile.getAttribute('aria-label') ?? ''),
    );
    const odd = labels.find((label) => !shapes.includes(label)) ?? '';
    await page.locator('.practice-options').getByRole('button', { name: odd, exact: true }).click();
    await expect(page.getByText(`Yes! ${odd} doesn't belong with Shapes.`)).toBeVisible();
    await page.getByRole('button', { name: /^(Next|Finish)$/ }).click();
  }
  await expect(page.getByText('⭐ 6 of 6 right on the first try')).toBeVisible();
});

test('the grown-ups question keeps kids out', async ({ page }) => {
  await page.getByRole('button', { name: 'Grown-ups' }).click();
  const gate = page.getByRole('dialog');
  await gate.getByLabel('Answer').fill('1000');
  await gate.getByRole('button', { name: 'Continue' }).click();
  await expect(gate.getByText("That's not it. Here's a new one.")).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Grown-ups', exact: true })).toHaveCount(0);
  await gate.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'What shall we learn?' })).toBeVisible();
});

test('grown-ups can make a card, and kids see it', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('button', { name: 'New card' }).first().click();
  const editor = page.getByRole('dialog');
  await editor.getByRole('button', { name: 'Text' }).click();
  await editor.getByLabel('Text on the front').fill('2 + 2');
  await editor.getByLabel('Word on the back').fill('4');
  await editor.getByLabel('New set').fill('Adding');
  await editor.getByRole('button', { name: 'Add set' }).click();
  await editor.getByRole('button', { name: 'Add card' }).click();
  await expect(editor).toBeHidden();
  await page.getByRole('button', { name: 'Done' }).click();
  await setTile(page, 'Adding').click();
  await expect(page.getByRole('button', { name: 'Flashcard for 4' })).toBeVisible();
});

test('grown-ups can add a set from the library', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Sets' }).click();
  await page.getByRole('button', { name: 'Set library' }).click();
  const library = page.getByRole('dialog');
  await library.getByRole('button', { name: /^The planets:/ }).click();
  await expect(library.getByText('Saturn', { exact: true })).toBeVisible();
  await library.getByRole('button', { name: 'Add The planets' }).click();
  await expect(library.getByRole('button', { name: 'The planets added' })).toBeVisible();
  await library.getByRole('button', { name: 'Close the library' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await setTile(page, 'The planets').click();
  await expect(page.getByRole('button', { name: 'Flashcard for Jupiter' })).toBeVisible();
});

test('grown-ups can pick the voice for a language, and hear when one is missing', async ({ page }) => {
  // Voices like Chrome's on a Windows computer, with no French voice. Speech is recorded, not played.
  await page.addInitScript(() => {
    const voice = (name: string, lang: string, isDefault = false) => ({ name, lang, voiceURI: name, localService: isDefault, default: isDefault });
    const voices = [voice('Microsoft David', 'en-US', true), voice('Google español', 'es-ES'), voice('Google español de Estados Unidos', 'es-US')];
    const spoken: { text: string; lang: string; voice: string | null }[] = [];
    Object.assign(window, { spoken });
    Object.assign(window, {
      SpeechSynthesisUtterance: class {
        text: string;
        lang = '';
        voice: { name: string } | null = null;
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.assign(window.speechSynthesis, {
      getVoices: () => voices,
      speak: (utterance: { text: string; lang: string; voice: { name: string } | null }) =>
        spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name ?? null }),
      cancel: () => undefined,
    });
  });
  await page.reload();

  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Sets' }).click();
  await page.getByRole('button', { name: 'Set library' }).click();
  const library = page.getByRole('dialog');
  await library.getByRole('button', { name: /^French: animals:/ }).click();
  await expect(library.getByText(/This device has no French voice/)).toBeVisible();
  await library.getByRole('button', { name: 'Add French: animals' }).click();
  await library.getByRole('button', { name: 'Back to the library' }).click();
  await library.getByRole('button', { name: 'Add Spanish: animals' }).click();
  await expect(library.getByRole('button', { name: 'Spanish: animals added' })).toBeVisible();
  await library.getByRole('button', { name: 'Close the library' }).click();
  await expect(page.getByText('No French voice on this device. See Settings.')).toBeVisible();

  await page.getByRole('tab', { name: 'Settings' }).click();
  const spanish = page.getByRole('combobox', { name: 'Spanish (Latin America)' });
  await expect(spanish).toHaveText('Automatic: Google español de Estados Unidos (needs the internet)');
  await spanish.click();
  await page.getByRole('option', { name: 'Google español (needs the internet)' }).click();
  await page.getByRole('button', { name: 'Hear the Spanish (Latin America) voice' }).click();
  const spoken = await page.evaluate(() => (window as unknown as { spoken: unknown[] }).spoken.at(-1));
  expect(spoken).toEqual({ text: 'el perro', lang: 'es-MX', voice: 'Google español' });
});

test('tricky cards explain how they work', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Sets' }).click();
  await page.getByRole('button', { name: 'Set library' }).click();
  const library = page.getByRole('dialog');
  await library.getByRole('button', { name: 'Add Logic gates' }).click();
  await expect(library.getByRole('button', { name: 'Logic gates added' })).toBeVisible();
  await library.getByRole('button', { name: 'Close the library' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  await setTile(page, 'Logic gates').click();
  await page.getByRole('button', { name: 'How this set works' }).click();
  const about = page.getByRole('dialog', { name: 'How this set works' });
  await expect(about.getByText(/Inside every computer are billions of tiny switches/)).toBeVisible();
  await about.getByRole('button', { name: 'Got it' }).click();
  await expect(about).toHaveCount(0);

  const card = page.getByRole('button', { name: 'Flashcard for XOR gate' });
  await card.click();
  await card.getByRole('button', { name: 'How XOR gate works' }).click();
  const explanation = page.getByRole('dialog', { name: 'How it works' });
  await expect(explanation.getByText('XOR gate', { exact: true })).toBeVisible();
  await expect(explanation.locator('.explain__equations')).toHaveText(/0 XOR 0 = 0\s*0 XOR 1 = 1\s*1 XOR 0 = 1\s*1 XOR 1 = 0/);
  await explanation.getByRole('button', { name: 'Close' }).click();
  await expect(explanation).toHaveCount(0);
});

test('a child can practice', async ({ page }) => {
  const practice = page.locator('section[aria-labelledby="practice-heading"]');
  await practice.getByRole('button', { name: 'Add child' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill('Ivy');
  await dialog.getByRole('button', { name: 'Add child' }).click();
  await expect(dialog).toBeHidden();
  await practice.getByRole('button', { name: 'Start' }).click();

  // Cards Ivy hasn't met are introduced first.
  await expect(page.getByText('New card 1 of 2')).toBeVisible();
  const introduced: string[] = [];
  for (;;) {
    introduced.push((await page.locator('.practice-intro__word').innerText()).trim());
    const next = page.getByRole('button', { name: /^(Next|Let's play!)$/ });
    const label = await next.innerText();
    await next.click();
    if (label.includes("Let's play")) break;
  }
  expect(introduced).toHaveLength(2);

  // Youngest settings: hear a word, then find its picture.
  const prompt = page.locator('.flashcard--practice');
  const word = (await prompt.getAttribute('aria-label'))?.replace('Flashcard for ', '') ?? '';
  await page.locator('.practice-options').getByRole('button', { name: word, exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`Yes! That's ${word}!`);
  await page.getByRole('button', { name: 'Stop practicing' }).click();
  await expect(page.getByRole('heading', { name: 'What shall we learn?' })).toBeVisible();

  // Grown-ups can see the answer in Ivy's progress.
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Children' }).click();
  await page.getByRole('button', { name: "Ivy's progress" }).click();
  await expect(page.getByText(/Last practiced today\. Met 1 of 31 cards/)).toBeVisible();
  await expect(page.locator('.progress-tile', { hasText: 'Learning' })).toContainText('1');
});

test('a shared set file can be imported', async ({ page }, testInfo) => {
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Sets' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Share Shapes' }).click()]);
  const file = testInfo.outputPath('shapes.json');
  await download.saveAs(file);

  await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles(file);
  const preview = page.getByRole('dialog');
  await expect(preview.getByText('10 cards · 10 pictures')).toBeVisible();
  await expect(preview.getByText(/so this one will be called “Shapes \(2\)”/)).toBeVisible();
  await preview.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByText('Shapes (2)', { exact: true })).toBeVisible();
});

test('a set shared to the installed app opens its preview', async ({ page }, testInfo) => {
  // Make a set file to share.
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Sets' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Share Colors' }).click()]);
  const file = testInfo.outputPath('colors.json');
  await download.saveAs(file);
  const text = readFileSync(file, 'utf8');

  // Android's share sheet posts the file to the app; the service worker keeps it for the app.
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) await page.reload();
  await page.evaluate(async (json) => {
    const form = new FormData();
    form.append('file', new File([json], 'colors-flashcards.json', { type: 'application/json' }));
    await fetch('/share-target', { method: 'POST', body: form });
  }, text);

  await page.goto('/');
  const gate = page.getByRole('dialog');
  const question = await gate.getByText(/What is \d+ × \d+\?/).innerText();
  const [, a, b] = question.match(/(\d+) × (\d+)/) ?? [];
  await gate.getByLabel('Answer').fill(String(Number(a) * Number(b)));
  await gate.getByRole('button', { name: 'Continue' }).click();
  const preview = page.getByRole('dialog');
  await expect(preview.getByText('Add this set?')).toBeVisible();
  await expect(preview.getByText('10 cards')).toBeVisible();
  await preview.getByRole('button', { name: 'Add set' }).click();
  await expect(page.getByText('Colors (2)', { exact: true })).toBeVisible();
});

test('a backup brings everything back', async ({ page }, testInfo) => {
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Settings' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save a backup' }).click()]);
  const file = testInfo.outputPath('backup.json');
  await download.saveAs(file);

  await page.getByRole('tab', { name: 'Sets' }).click();
  await page.getByRole('button', { name: 'More for Colors' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete set and cards' }).click();
  await expect(page.getByText('Colors', { exact: true })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles(file);
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Replace and restore' }).click()]);
  await expect(setTile(page, 'Colors')).toBeVisible();
});

/** Touches the screen at a point, slides the finger by (dx, dy) in a few steps, then lifts it. */
async function touchSlide(page: Page, x: number, y: number, dx: number, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  const steps = 5;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= steps; step += 1) {
    const point = { x: x + (dx * step) / steps, y: y + (dy * step) / steps };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

const centerOf = async (page: Page, name: string) => {
  const box = await page.getByRole('button', { name }).boundingBox();
  if (!box) throw new Error(`No ${name} on screen`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test('a wobbly touch turns a card over, and a double tap turns it just once', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'Needs a touch screen');
  await setTile(page, 'Numbers 0-10').click();

  // A finger that slides a little as it presses (no tap, as far as the browser is concerned).
  const one = page.getByRole('button', { name: 'Flashcard for One', exact: true });
  await one.scrollIntoViewIfNeeded();
  const start = await centerOf(page, 'Flashcard for One');
  await touchSlide(page, start.x, start.y, 22, 14);
  await expect(one).toHaveAttribute('aria-pressed', 'true');

  // Two quick taps are one press, so the card stays turned over.
  const two = page.getByRole('button', { name: 'Flashcard for Two', exact: true });
  await two.scrollIntoViewIfNeeded();
  const point = await centerOf(page, 'Flashcard for Two');
  await page.touchscreen.tap(point.x, point.y);
  await page.touchscreen.tap(point.x, point.y);
  await expect(two).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(600);
  await expect(two).toHaveAttribute('aria-pressed', 'true');

  // A later tap turns it back.
  await page.touchscreen.tap(point.x, point.y);
  await expect(two).toHaveAttribute('aria-pressed', 'false');

  // Keyboards still work.
  await two.focus();
  await page.keyboard.press('Enter');
  await expect(two).toHaveAttribute('aria-pressed', 'true');
});

test('scrolling past the cards leaves them face down', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'Needs a touch screen');
  await setTile(page, 'Numbers 0-10').click();
  const card = page.getByRole('button', { name: 'Flashcard for Four', exact: true });
  await card.scrollIntoViewIfNeeded();
  const start = await centerOf(page, 'Flashcard for Four');
  const scrolledBefore = await page.evaluate(() => window.scrollY);
  await touchSlide(page, start.x, start.y, 0, -300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolledBefore + 100);
  await expect(card).toHaveAttribute('aria-pressed', 'false');
});

test('kid lock keeps kids in the app until a grown-up turns it off', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Beanchain Coffee' })).toBeVisible();
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Kid lock' }).check();
  await expect(page.locator('html')).toHaveClass(/kid-lock/);
  await page.getByRole('button', { name: 'Done' }).click();

  // Nothing on the home screen leads to another website.
  await expect(page.getByText('Beanchain Coffee')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Beanchain Coffee' })).toHaveCount(0);

  // Going back from a set goes home, and going back from home stays home.
  await setTile(page, 'Numbers 0-10').click();
  await expect(page.getByRole('button', { name: 'Flashcard for Three', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'What shall we learn?' })).toBeVisible();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/localhost:4173\/#\/$/);
  await expect(page.getByRole('heading', { name: 'What shall we learn?' })).toBeVisible();

  // Still on after a reload, and off again from Grown-ups.
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/kid-lock/);
  await openGrownUps(page);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Kid lock' }).uncheck();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('html')).not.toHaveClass(/kid-lock/);
  await expect(page.getByRole('link', { name: 'Beanchain Coffee' })).toBeVisible();
});
