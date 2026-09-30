import { CSSProperties } from 'react';

// Card words are sized so their widest word fits on one line: lines break only between words or
// after a hyphen, never in the middle of a word ("Wednes-day").

const FONT_FAMILY = '"Baloo 2", "Segoe UI", system-ui, -apple-system, sans-serif';

let context: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, number>();

function measuringContext() {
  if (context === undefined) {
    context = typeof document === 'undefined' ? null : (document.createElement('canvas').getContext('2d') ?? null);
  }
  return context;
}

/**
 * The pieces a line may break between: words, and the parts of hyphenated words. Number ranges like
 * "0-10" stay whole.
 */
export const unbreakableParts = (text: string) =>
  text
    .split(/\s+/)
    .flatMap((word) => word.split(/(?<=\D-)|(?<=-)(?=\D)/))
    .filter(Boolean);

/** Splits text into plain parts and number ranges ("Numbers 0-10" → "Numbers ", "0-10"). */
export const splitRanges = (text: string) => text.split(/(\d+(?:-\d+)+)/).filter(Boolean);

// Rough widths in em, for when there's no canvas to measure with (as in unit tests).
const estimateEm = (part: string) =>
  [...part].reduce((width, char) => width + (/[A-Z0-9]/.test(char) ? 0.72 : char.codePointAt(0)! <= 0x24f ? 0.6 : 1.1), 0);

/** The width, in em, of the widest part of `text` that can't be split across lines. */
export function widestPartEm(text: string, weight = 700) {
  const key = `${weight}|${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const ctx = measuringContext();
  if (ctx) ctx.font = `${weight} 100px ${FONT_FAMILY}`;
  const widest = Math.max(0, ...unbreakableParts(text).map((part) => (ctx ? ctx.measureText(part).width / 100 : estimateEm(part))));
  cache.set(key, widest);
  return widest;
}

// Text drawn at a small size can come out a little wider than it measures at 100px, as each letter's
// width is rounded, so words are given a bit of room to spare.
const FIT_MARGIN = 1.06;

/**
 * Style for text whose CSS caps its size with `calc(<space> / var(--fit-em))`, so the widest word
 * fits in the space.
 */
export const fitStyle = (text: string, weight?: number) =>
  ({ '--fit-em': Math.max(0.5, widestPartEm(text, weight) * FIT_MARGIN).toFixed(3) }) as CSSProperties;

/** Forgets measurements, e.g. once the app's web font has loaded and text is measured again. */
export const clearTextFit = () => cache.clear();
