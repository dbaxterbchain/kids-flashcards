import { describe, expect, it } from 'vitest';
import { buildOptions, buildRound, filterCardsForSets, formatTimeUntil, promptSideFor, shuffle } from './practice';
import { testCard } from './testCards';
import { UNCATEGORIZED_SET_ID } from './types';

describe('buildOptions', () => {
  const animals = ['Cat', 'Dog', 'Cow', 'Pig', 'Hen'].map((name) => testCard(name.toLowerCase(), { name, setIds: ['animals'] }));
  const colors = ['Red', 'Blue', 'Green'].map((name) => testCard(name.toLowerCase(), { name, setIds: ['colors'] }));
  const pool = [...animals, ...colors];

  it('includes the answer and the requested number of choices', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const options = buildOptions(animals[0], pool, 3, seed);
      expect(options).toHaveLength(3);
      expect(options).toContain(animals[0]);
    }
  });

  it('prefers wrong answers from the same set', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const options = buildOptions(animals[0], pool, 4, seed);
      expect(options.every((card) => card.setIds?.includes('animals'))).toBe(true);
    }
  });

  it('never offers two choices with the same name', () => {
    const solids = ['ice', 'brick', 'spoon'].map((id) => testCard(id, { name: 'Solid', setIds: ['matter'] }));
    const others = [testCard('water', { name: 'Liquid', setIds: ['matter'] }), testCard('air', { name: 'Gas', setIds: ['matter'] })];
    for (let seed = 1; seed <= 20; seed += 1) {
      const options = buildOptions(solids[0], [...solids, ...others], 4, seed);
      const names = options.map((card) => card.name);
      expect(new Set(names).size).toBe(names.length);
      expect(options).toContain(solids[0]);
    }
  });

  it('is the same for the same seed', () => {
    expect(buildOptions(animals[1], pool, 4, 42)).toEqual(buildOptions(animals[1], pool, 4, 42));
  });
});

describe('buildRound', () => {
  it('picks at most a round of cards, with no repeats', () => {
    const cards = Array.from({ length: 12 }, (_, index) => testCard(`card-${index}`));
    const round = buildRound(cards, {}, 5);
    expect(round).toHaveLength(5);
    expect(new Set(round).size).toBe(5);
    expect(round.every((id) => cards.some((card) => card.id === id))).toBe(true);
    expect(buildRound(cards.slice(0, 3), {}, 5)).toHaveLength(3);
  });
});

describe('filterCardsForSets', () => {
  const cards = [testCard('a', { setIds: ['one'] }), testCard('b', { setIds: ['two'] }), testCard('c', { setIds: [] })];

  it('uses every card when no sets are chosen', () => {
    expect(filterCardsForSets(cards, null)).toHaveLength(3);
  });

  it('keeps cards from the chosen sets, and cards without a set only when asked', () => {
    expect(filterCardsForSets(cards, ['one']).map((card) => card.id)).toEqual(['a']);
    expect(filterCardsForSets(cards, ['two', UNCATEGORIZED_SET_ID]).map((card) => card.id)).toEqual(['b', 'c']);
  });
});

describe('small helpers', () => {
  it('shuffles without losing or adding anything', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect([...shuffle(items)].sort()).toEqual(items);
  });

  it('alternates question types in a mixed round', () => {
    expect([0, 1, 2].map((index) => promptSideFor('mix', index))).toEqual(['find-picture', 'name-picture', 'find-picture']);
    expect(promptSideFor('name-picture', 0)).toBe('name-picture');
  });

  it('formats how long until the next card is due', () => {
    expect(formatTimeUntil(0)).toBe('now');
    expect(formatTimeUntil(5 * 60 * 1000)).toBe('5 min');
    expect(formatTimeUntil(3 * 60 * 60 * 1000)).toBe('3 hr');
    expect(formatTimeUntil(24 * 60 * 60 * 1000)).toBe('1 day');
    expect(formatTimeUntil(3 * 24 * 60 * 60 * 1000)).toBe('3 days');
  });
});
