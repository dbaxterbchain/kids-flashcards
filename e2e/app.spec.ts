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
  await expect(library.getByText('Saturn')).toBeVisible();
  await library.getByRole('button', { name: 'Add The planets' }).click();
  await expect(library.getByRole('button', { name: 'The planets added' })).toBeVisible();
  await library.getByRole('button', { name: 'Close the library' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await setTile(page, 'The planets').click();
  await expect(page.getByRole('button', { name: 'Flashcard for Jupiter' })).toBeVisible();
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
