// Makes the logo, favicons, app icons and the share image from logo.mjs:
//
//   npm run brand
//
// Uses the browser Playwright installs to draw them, and sharp (if it's installed) to make the PNGs
// smaller. The share image uses the app's font (see fonts.mjs).
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { fontCss } from './fonts.mjs';
import { logoSvg } from './logo.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, '../../public');
const sharp = await import('sharp').then((module) => module.default).catch(() => null);
if (!sharp) console.warn('sharp isn\'t installed, so the PNGs won\'t be compressed (npm install --no-save sharp).');

const compress = async (png) =>
  sharp ? sharp(png).png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 }).toBuffer() : png;


const browser = await chromium.launch();
const page = await browser.newPage();

async function render(svg, size, transparent) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${size}" height="${size}" style="display:block"></body></html>`,
  );
  await page.locator('img').evaluate((img) => img.decode());
  return page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
}

// --- The logo and icons -------------------------------------------------------------------------------

mkdirSync(join(PUBLIC, 'icons'), { recursive: true });
const rounded = logoSvg();
// Full-bleed, for launchers that cut their own shape: the art stays inside the middle 80% (the safe zone).
const maskable = logoSvg({ background: 'full', scale: 0.8 });
// iOS rounds the corners itself and turns transparency black, so this one fills the square.
const apple = logoSvg({ background: 'full', scale: 0.92 });

writeFileSync(join(PUBLIC, 'logo.svg'), `${rounded.replace(/\n\s*/g, '')}\n`);
const icons = [
  ['icons/icon-192.png', rounded, 192, true],
  ['icons/icon-512.png', rounded, 512, true],
  ['icons/icon-maskable-192.png', maskable, 192, false],
  ['icons/icon-maskable-512.png', maskable, 512, false],
  ['icons/apple-touch-icon.png', apple, 180, false],
];
for (const [file, svg, size, transparent] of icons) writeFileSync(join(PUBLIC, file), await compress(await render(svg, size, transparent)));

// favicon.ico, for older browsers and tools that ask for it: 16, 32 and 48 pixel PNGs in one file.
const images = [];
for (const size of [16, 32, 48]) images.push({ size, data: await render(rounded, size, true) });
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(({ size, data }, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
writeFileSync(join(PUBLIC, 'favicon.ico'), Buffer.concat([header, ...images.map(({ data }) => data)]));

// --- The share image (1200 × 630) -----------------------------------------------------------------------

const card = (file) => `data:image/svg+xml,${encodeURIComponent(readFileSync(join(here, 'cards', file), 'utf8'))}`;
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head><style>
  ${fontCss([700, 800])}
  * { box-sizing: border-box; }
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: 'Baloo 2', sans-serif; color: #0f172a;
    background:
      radial-gradient(circle at 8% 12%, rgba(125, 224, 213, 0.55), transparent 32%),
      radial-gradient(circle at 92% 95%, rgba(255, 126, 182, 0.35), transparent 34%),
      radial-gradient(circle at 70% 8%, rgba(255, 209, 102, 0.45), transparent 30%),
      #f4f7ff; }
  .text { position: absolute; left: 76px; top: 70px; width: 600px; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand img { width: 112px; height: 112px; filter: drop-shadow(0 10px 18px rgba(37, 99, 235, 0.3)); }
  .name { font-size: 70px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
  .name span { color: #2563eb; }
  h1 { margin: 46px 0 0; font-size: 50px; font-weight: 800; line-height: 1.08; letter-spacing: -0.01em; }
  p { margin: 18px 0 0; font-size: 28px; font-weight: 700; color: #475569; line-height: 1.3; }
  .pills { display: flex; gap: 12px; margin-top: 30px; }
  .pill { padding: 8px 20px 6px; border-radius: 999px; background: #ffffff; font-size: 24px; font-weight: 800;
    color: #1d4ed8; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08); border: 2px solid rgba(37, 99, 235, 0.15); }
  .card { position: absolute; width: 250px; height: 312px; border-radius: 26px; overflow: hidden;
    box-shadow: 0 22px 40px rgba(15, 23, 42, 0.2), 0 4px 10px rgba(15, 23, 42, 0.08); border: 6px solid #ffffff; }
  .card img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .earth { left: 700px; top: 150px; transform: rotate(-12deg); background: #0b1026; }
  .three { left: 850px; top: 88px; transform: rotate(4deg); background: #fde047; }
  .word { left: 900px; top: 262px; transform: rotate(14deg); display: grid; place-items: center;
    background: linear-gradient(135deg, #ffd166, #ff7eb6); }
  .word b { font-size: 50px; font-weight: 800; color: #1f1f1f; }
</style></head><body>
  <div class="text">
    <div class="brand"><img src="data:image/svg+xml,${encodeURIComponent(rounded)}" alt=""><div class="name"><span>Kids</span> Flashcards</div></div>
    <h1>Flashcards made with your own photos and voice</h1>
    <p>60+ ready-made sets, games and stickers for kids 2 and up</p>
    <div class="pills"><span class="pill">Free</span><span class="pill">No sign-up</span><span class="pill">Works offline</span></div>
  </div>
  <div class="card earth"><img src="${card('earth.svg')}" alt=""></div>
  <div class="card three"><img src="${card('three.svg')}" alt=""></div>
  <div class="card word"><b>Grandma</b></div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
writeFileSync(join(PUBLIC, 'og-image.png'), await compress(await page.screenshot()));

await browser.close();
console.log('Wrote public/logo.svg, public/favicon.ico, public/icons/*.png and public/og-image.png');
