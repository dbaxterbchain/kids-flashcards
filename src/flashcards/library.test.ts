import { describe, expect, it } from 'vitest';
import {
  describeLibraryUpdate,
  LIBRARY_SUBJECTS,
  libraryCardId,
  librarySetId,
  libraryUpdate,
  prepareLibrarySet,
} from './library';
import { GateKind, gateOutput } from './libraryLogic';
import { LIBRARY_SETS } from './librarySets';
import { readColor, readDataUrl, readLang } from './sanitize';
import { testCard } from './testCards';
import { FlashcardData } from './types';

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
      if (card.prompt) expect(card.prompt.length, label).toBeLessThanOrEqual(120);
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

  it('has talk-about-it questions for everyday sets', () => {
    const withPrompts = LIBRARY_SETS.filter((entry) => entry.cards.every((card) => card.prompt));
    expect(withPrompts.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['farm-animals', 'feelings', 'body-parts', 'weather', 'opposites']),
    );
  });

  it("doesn't repeat a front within a set, so every question has one right picture", () => {
    for (const entry of LIBRARY_SETS) {
      const fronts = entry.cards.map((card) => card.imageUrl || card.frontText || card.backgroundColor);
      expect(new Set(fronts).size, entry.name).toBe(fronts.length);
      // Sets that sort cards into groups (several cards per name) need at least two groups.
      expect(new Set(entry.cards.map((card) => card.name)).size, entry.name).toBeGreaterThanOrEqual(2);
    }
  });

  it('explains the tricky sets, card by card, in words that fit the card editor', () => {
    const explained = LIBRARY_SETS.filter((entry) => entry.cards.every((card) => card.explain));
    expect(explained.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'binary',
        'logic-gates',
        'logic-gate-puzzles',
        'coding-words',
        'computer-parts',
        'element-symbols',
        'fractions',
        'telling-time',
        'animal-groups',
        'solid-liquid-gas',
        'days-of-the-week',
        'months',
      ]),
    );
    for (const { entry, card } of allCards) {
      if (card.explain) expect(card.explain.length, `${entry.name}: ${card.name}`).toBeLessThanOrEqual(600);
    }
    for (const entry of LIBRARY_SETS) {
      if (entry.about) expect(entry.about.length, entry.name).toBeLessThanOrEqual(1000);
    }
    expect(LIBRARY_SETS.find((entry) => entry.id === 'binary')?.about).toMatch(/1, 2, 4 and 8/);
  });

  it('works out binary numbers in their explanations', () => {
    const binary = LIBRARY_SETS.find((entry) => entry.id === 'binary')!;
    expect(binary.cards.find((card) => card.name === '11')?.explain).toContain('8 + 2 + 1 = 11');
    expect(binary.cards.find((card) => card.name === '4')?.explain).toContain('only in the 4s place');
  });
});

describe('logic gates', () => {
  const truthTable = (kind: GateKind) =>
    ([[0, 0], [0, 1], [1, 0], [1, 1]] as const).map((bits) => gateOutput(kind, [...bits])).join('');

  it('follows each gate’s rule', () => {
    expect(truthTable('AND')).toBe('0001');
    expect(truthTable('OR')).toBe('0111');
    expect(truthTable('NAND')).toBe('1110');
    expect(truthTable('NOR')).toBe('1000');
    expect(truthTable('XOR')).toBe('0110');
    expect(truthTable('XNOR')).toBe('1001');
    expect([gateOutput('NOT', [0]), gateOutput('NOT', [1])]).toEqual([1, 0]);
  });

  it('puts the right truth table in each gate’s explanation', () => {
    const gates = LIBRARY_SETS.find((entry) => entry.id === 'logic-gates')!;
    expect(gates.cards.map((card) => card.name)).toEqual([
      'AND gate',
      'OR gate',
      'NOT gate',
      'NAND gate',
      'NOR gate',
      'XOR gate',
      'XNOR gate',
    ]);
    const xor = gates.cards.find((card) => card.name === 'XOR gate')!;
    expect(xor.explain).toContain('0 XOR 0 = 0\n0 XOR 1 = 1\n1 XOR 0 = 1\n1 XOR 1 = 0');
  });

  it('answers each puzzle with what its gate gives out, as many 1s as 0s', () => {
    const puzzles = LIBRARY_SETS.find((entry) => entry.id === 'logic-gate-puzzles')!;
    for (const card of puzzles.cards) {
      const [kind, ...bits] = card.key.split('-');
      const gate = kind.toUpperCase() as GateKind;
      const output = gateOutput(
        gate,
        bits.map((bit): 0 | 1 => (bit === '1' ? 1 : 0)),
      );
      expect(card.name, card.key).toBe(String(output));
      expect(card.explain, card.key).toMatch(new RegExp(`= ${output}\\n`));
    }
    const ones = puzzles.cards.filter((card) => card.name === '1').length;
    expect(ones * 2).toBe(puzzles.cards.length);
  });
});

describe('libraryUpdate', () => {
  const entry = LIBRARY_SETS.find((candidate) => candidate.id === 'binary')!;
  const { set, cards } = prepareLibrarySet(entry, [], [], 1000);
  // A family's copy from before the library had explanations, with some of their own changes.
  const oldSet = { id: set.id, name: 'Binary' };
  const oldCards: FlashcardData[] = cards.map(({ explain: _explain, ...card }) => card);
  oldCards[0] = { ...oldCards[0], explain: 'Our own words.' };
  oldCards[1] = { ...oldCards[1], name: 'Renamed' };

  it('fills in only what is missing', () => {
    const update = libraryUpdate(entry, [oldSet], oldCards)!;
    expect(update.set).toEqual({ ...oldSet, about: entry.about });
    expect(update.about).toBe(true);
    expect(update.explanations).toBe(cards.length - 2);
    expect(update.cards.map((card) => card.id)).not.toContain(oldCards[0].id);
    expect(update.cards.map((card) => card.id)).not.toContain(oldCards[1].id);
    expect(update.cards.every((card) => card.explain && card.setIds?.includes(set.id))).toBe(true);
    expect(describeLibraryUpdate(update)).toBe(`${cards.length - 2} “How it works” explanations and a “How this set works” introduction`);
  });

  it('has nothing to add to sets that are up to date, or not added', () => {
    expect(libraryUpdate(entry, [set], cards)).toBeNull();
    expect(libraryUpdate(entry, [], oldCards)).toBeNull();
  });

  it("keeps a family's own introduction", () => {
    const update = libraryUpdate(entry, [{ ...oldSet, about: 'Ours.' }], oldCards)!;
    expect(update.about).toBe(false);
    expect(update.set.about).toBe('Ours.');
  });

  it("swaps emoji some devices can't show for the library's drawings, unless a family chose a picture", () => {
    const body = LIBRARY_SETS.find((candidate) => candidate.id === 'human-body')!;
    const added = prepareLibrarySet(body, [], [], 1000);
    expect(added.cards.some((card) => 'previousFronts' in card)).toBe(false);
    // Added before the heart and lungs were drawn, when they were emoji. This family photographed lungs.
    const before = added.cards.map((card) => {
      if (card.name === 'Heart') return { ...card, imageUrl: '', frontText: '🫀' };
      if (card.name === 'Lungs') return { ...card, imageUrl: 'data:image/png;base64,AA', frontText: undefined };
      return card;
    });
    const update = libraryUpdate(body, [added.set], before)!;
    expect(update.pictures).toBe(1);
    expect(update.cards.map((card) => card.name)).toEqual(['Heart']);
    expect(update.cards[0].imageUrl).toMatch(/^data:image\/svg\+xml/);
    expect(update.cards[0].frontText).toBeUndefined();
    expect(describeLibraryUpdate(update)).toBe('a new picture');
    // Adding the set again does the same.
    const readded = prepareLibrarySet(body, [], before);
    expect(readded.cards.find((card) => card.name === 'Heart')?.imageUrl).toBe(update.cards[0].imageUrl);
    expect(readded.cards.find((card) => card.name === 'Lungs')?.imageUrl).toBe('data:image/png;base64,AA');
  });

  it('adds talk-about-it questions too', () => {
    const farm = LIBRARY_SETS.find((candidate) => candidate.id === 'farm-animals')!;
    const added = prepareLibrarySet(farm, [], [], 1000);
    const withoutPrompts = added.cards.map(({ prompt: _prompt, ...card }) => card);
    const update = libraryUpdate(farm, [added.set], withoutPrompts)!;
    expect(update.prompts).toBe(farm.cards.length);
    expect(describeLibraryUpdate(update)).toBe(`${farm.cards.length} talk-about-it questions`);
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
