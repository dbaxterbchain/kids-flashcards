import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * CSS for the app's font, Baloo 2: from Google Fonts, or from FONT_DIR when set to a folder of files
 * named like baloo-2-latin-800-normal.woff2 (from @fontsource/baloo-2), for when Google Fonts can't
 * be reached.
 */
export function fontCss(weights = [400, 600, 700, 800]) {
  const dir = process.env.FONT_DIR;
  if (!dir) return `@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@${weights.join(';')}&display=block');`;
  return weights
    .map((weight) => {
      const file = join(dir, `baloo-2-latin-${weight}-normal.woff2`);
      if (!existsSync(file)) throw new Error(`Missing ${file}`);
      return `@font-face { font-family: 'Baloo 2'; font-weight: ${weight}; src: url(data:font/woff2;base64,${readFileSync(file).toString('base64')}) format('woff2'); }`;
    })
    .join('\n');
}
