import { describe, expect, it } from 'vitest';
import { printSheets } from './printLayout';
import { testCard } from './testCards';

const ids = (cards: ({ id: string } | null)[]) => cards.map((card) => card?.id ?? '-');

describe('printSheets', () => {
  it('mirrors each row of backs so they line up behind the fronts', () => {
    const [sheet] = printSheets(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => testCard(id)));
    expect(ids(sheet.fronts)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(ids(sheet.backs)).toEqual(['b', 'a', 'd', 'c', 'f', 'e']);
  });

  it('fills a page at a time, leaving the gaps empty', () => {
    const sheets = printSheets(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => testCard(id)));
    expect(sheets).toHaveLength(2);
    expect(ids(sheets[1].fronts)).toEqual(['g', '-', '-', '-', '-', '-']);
    expect(ids(sheets[1].backs)).toEqual(['-', 'g', '-', '-', '-', '-']);
  });
});
