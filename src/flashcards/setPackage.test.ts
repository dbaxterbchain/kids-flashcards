import { describe, expect, it } from 'vitest';
import { createSetPackage, parseSetPackage, prepareSetImport, uniqueSetId, uniqueSetName } from './setPackage';
import { testCard } from './testCards';
import { UNCATEGORIZED_SET_ID } from './types';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZF';

const cards = [
  testCard('older', {
    name: 'Grandpa',
    imageUrl: PNG,
    createdAt: 1,
    setIds: ['family', 'favorites'],
    review: { lastReviewedAt: 1, nextReviewAt: 2, intervalDays: 1, easeFactor: 2.5, reviewCount: 1 },
  }),
  testCard('newer', { name: 'Abuela', imageUrl: PNG, audioUrl: WAV, lang: 'es-MX', backgroundColor: '#fde68a', createdAt: 2, setIds: ['family'] }),
];

describe('sharing a set', () => {
  it('packs the cards without progress or other sets', () => {
    const pkg = createSetPackage('Family', cards);
    expect(pkg.format).toBe('kids-flashcards-set');
    expect(pkg.cards.every((card) => !('review' in card) && !('setIds' in card))).toBe(true);
  });

  it('reads back everything a card needs, newest first', () => {
    const parsed = parseSetPackage(JSON.stringify(createSetPackage('Family', cards)));
    expect(parsed.name).toBe('Family');
    expect(parsed.cards.map((card) => card.name)).toEqual(['Abuela', 'Grandpa']);
    expect(parsed.cards[0]).toMatchObject({ imageUrl: PNG, audioUrl: WAV, lang: 'es-MX', backgroundColor: '#fde68a' });
  });

  it('explains what went wrong with other files', () => {
    expect(() => parseSetPackage('{')).toThrow(/isn't a Kids Flashcards set/);
    expect(() => parseSetPackage(JSON.stringify({ format: 'kids-flashcards-backup', version: 1 }))).toThrow(/Restore from a backup/);
    expect(() => parseSetPackage(JSON.stringify({ format: 'kids-flashcards-set', version: 2, cards: [] }))).toThrow(/newer version/);
    expect(() => parseSetPackage(JSON.stringify({ format: 'kids-flashcards-set', version: 1, cards: [] }))).toThrow(/no cards/);
  });

  it('names an unnamed set', () => {
    const pkg = { ...createSetPackage('   ', cards) };
    expect(parseSetPackage(JSON.stringify(pkg)).name).toBe('Shared set');
  });
});

describe('importing a set', () => {
  const existing = [{ id: 'family', name: 'Family' }];

  it('makes new cards in a new set, keeping their order', () => {
    const pkg = parseSetPackage(JSON.stringify(createSetPackage('Family', cards)));
    const { set, cards: imported } = prepareSetImport(pkg, existing, { setId: 'family-2', cardId: (index) => `new-${index}` }, 1000);
    expect(set).toEqual({ id: 'family-2', name: 'Family (2)' });
    expect(imported.map((card) => [card.id, card.name, card.createdAt])).toEqual([
      ['new-0', 'Abuela', 1000],
      ['new-1', 'Grandpa', 999],
    ]);
    expect(imported.every((card) => card.setIds?.length === 1 && card.setIds[0] === 'family-2' && !card.review)).toBe(true);
  });

  it('picks ids and names nothing else uses', () => {
    expect(uniqueSetId('My Family', [])).toBe('my-family');
    expect(uniqueSetId('My Family', ['my-family', 'my-family-2'])).toBe('my-family-3');
    expect(uniqueSetId('Uncategorized', [])).not.toBe(UNCATEGORIZED_SET_ID);
    expect(uniqueSetName('family', existing)).toBe('family (2)');
    expect(uniqueSetName('Friends', existing)).toBe('Friends');
  });
});
