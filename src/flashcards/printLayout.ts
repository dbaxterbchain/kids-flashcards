import { FlashcardData } from './types';

/** Cards per printed page: 2 across and 3 down fits both Letter and A4 paper. */
export const PRINT_COLUMNS = 2;
export const PRINT_ROWS = 3;
export const CARDS_PER_PAGE = PRINT_COLUMNS * PRINT_ROWS;

export type PrintSheet = {
  fronts: (FlashcardData | null)[];
  /** The same cards, each row mirrored, so fronts and backs line up when printed on both sides. */
  backs: (FlashcardData | null)[];
};

/**
 * Lays cards out for double-sided printing, flipped on the long edge: each page of fronts is followed
 * by its page of backs, with the columns swapped so every back lands behind its front. Empty spots
 * are null.
 */
export function printSheets(cards: FlashcardData[]): PrintSheet[] {
  const sheets: PrintSheet[] = [];
  for (let start = 0; start < cards.length; start += CARDS_PER_PAGE) {
    const fronts: (FlashcardData | null)[] = Array.from({ length: CARDS_PER_PAGE }, (_, index) => cards[start + index] ?? null);
    const backs = fronts.map((_, index) => {
      const row = Math.floor(index / PRINT_COLUMNS);
      const column = index % PRINT_COLUMNS;
      return fronts[row * PRINT_COLUMNS + (PRINT_COLUMNS - 1 - column)];
    });
    sheets.push({ fronts, backs });
  }
  return sheets;
}
