import { describe, expect, it } from 'vitest';
import { LIBRARY_SUBJECTS, libraryCardId, librarySetId, prepareLibrarySet } from './library';
import { LIBRARY_SETS } from './librarySets';
import { readColor, readDataUrl, readLang } from './sanitize';
import { testCard } from './testCards';

const allCards = LIBRARY_SETS.flatMap((entry) => entry.cards.map((card) => ({ entry, card })));

describe('the set library', () => {
  it('has unique set and card ids', () => {
    const setIds = LIBRARY_SETS.map(librarySetId);
    expect(new Set(setIds).size).toBe(setIds.length);
    const cardIds = allCards.map(({ entry, card }) => libraryCardId(entry, card));
    expect(new Set(cardIds).size).toBe(cardIds.length);
  });

  it('has sets for every subject, each with enough cards to practice', () => {
    for (const subject of LIBRARY_SUBJECTS) {
      expect(LIBRARY_SETS.some((entry) => entry.subject === subject.id), subject.label).toBe(true);
    }
    for (const entry of LIBRARY_SETS) {
      expect(entry.cards.length, entry.name).toBeGreaterThanOrEqual(5);
      expect(entry.name.length, entry.name).toBeLessThanOrEqual(30);
    }
  });

  it('gives every card a word and a front that the editor and backups accept', () => {
    for (const { entry, card } of allCards) {
      const label = `${entry.name}: ${card.name}`;
      expect(card.name.trim(), label).toBe(card.name);
      expect(card.name.length, label).toBeGreaterThan(0);
      expect(card.name.length, label).toBeLessThanOrEqual(40);
      expect(Boolean(card.imageUrl || card.frontText || card.backgroundColor), label).toBe(true);
      if (card.imageUrl) expect(readDataUrl(card.imageUrl, 'image'), label).toBe(card.imageUrl);
      if (card.frontText) expect(card.frontText.length, label).toBeLessThanOrEqual(60);
      if (card.backgroundColor) expect(readColor(card.backgroundColor), label).toBe(card.backgroundColor);
      if (card.lang) expect(readLang(card.lang), label).toBe(card.lang);
      expect(card.lang, label).toBe(entry.lang);
    }
  });

  it('shows emoji in color rather than as plain symbols', () => {
    for (const { entry, card } of allCards) {
      const text = card.frontText ?? '';
      if (/\p{Extended_Pictographic}/u.test(text)) {
        expect(/\p{Emoji_Presentation}|️/u.test(text), `${entry.name}: ${card.name}`).toBe(true);
      }
    }
  });

  it("doesn't repeat a front within a set, so every question has one right picture", () => {
    for (const entry of LIBRARY_SETS) {
      const fronts = entry.cards.map((card) => card.imageUrl || card.frontText || card.backgroundColor);
      expect(new Set(fronts).size, entry.name).toBe(fronts.length);
      // Sets that sort cards into groups (several cards per name) need at least two groups.
      expect(new Set(entry.cards.map((card) => card.name)).size, entry.name).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('prepareLibrarySet', () => {
  const entry = LIBRARY_SETS.find((candidate) => candidate.id === 'farm-animals')!;

  it('makes a set with stable ids, in the library order', () => {
    const { set, cards } = prepareLibrarySet(entry, [], [], 1000);
    expect(set).toEqual({ id: 'library-farm-animals', name: 'Farm animals' });
    expect(cards).toHaveLength(entry.cards.length);
    expect(cards[0]).toMatchObject({ id: 'library-farm-animals-cow', name: 'Cow', setIds: [set.id], createdAt: 1000 });
    expect(cards[1].createdAt).toBe(999);
    expect(cards.some((card) => 'key' in card)).toBe(false);
  });

  it('reuses cards kept from an earlier add, edits included', () => {
    const kept = testCard('library-farm-animals-cow', { name: 'Moo cow', audioUrl: 'data:audio/wav;base64,AA', setIds: ['favorites'] });
    const { cards } = prepareLibrarySet(entry, [], [kept], 1000);
    expect(cards[0]).toMatchObject({ name: 'Moo cow', audioUrl: kept.audioUrl, setIds: ['favorites', 'library-farm-animals'] });
  });

  it("doesn't take the name of a set the family already has", () => {
    expect(prepareLibrarySet(entry, [{ id: 'mine', name: 'Farm Animals' }], []).set.name).toBe('Farm animals (2)');
  });
});
