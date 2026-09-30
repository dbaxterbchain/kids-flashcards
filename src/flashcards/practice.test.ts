import { describe, expect, it } from 'vitest';
import {
  buildOptions,
  buildRound,
  createSeededRng,
  filterCardsForSets,
  formatTimeUntil,
  newCardsPerRound,
  promptSideFor,
  shuffle,
  withDefaultSettings,
} from './practice';
import { applyReviewResult } from './review';
import { testCard } from './testCards';
import { ChildProfile, UNCATEGORIZED_SET_ID } from './types';

const DAY = 24 * 60 * 60 * 1000;

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
  const cards = Array.from({ length: 12 }, (_, index) => testCard(`card-${index}`, { createdAt: index }));
  const answered = (ids: string[]) =>
    Object.fromEntries(ids.map((id) => [id, applyReviewResult(undefined, true, Date.now() - 2 * DAY)]));

  it('picks at most a round of cards, with no repeats', () => {
    const { cardIds, newCardIds } = buildRound(cards, {}, 5);
    expect(cardIds).toHaveLength(5);
    expect(new Set(cardIds).size).toBe(5);
    expect(cardIds.every((id) => cards.some((card) => card.id === id))).toBe(true);
    expect(newCardIds).toEqual([]);
    expect(buildRound(cards.slice(0, 3), {}, 5).cardIds).toHaveLength(3);
  });

  it('introduces a few new cards at most, newest first, and fills up with familiar ones', () => {
    const progress = answered(['card-0', 'card-1', 'card-2', 'card-3', 'card-4']);
    const { cardIds, newCardIds } = buildRound(cards, progress, 10, { introduceNew: true });
    expect(newCardIds).toEqual(['card-11', 'card-10', 'card-9']);
    expect(cardIds).toHaveLength(8);
    expect(newCardIds.every((id) => cardIds.includes(id))).toBe(true);
  });

  it('starts the questions with a familiar card when there is one', () => {
    const progress = answered(['card-0']);
    for (let seed = 1; seed <= 20; seed += 1) {
      const { cardIds } = buildRound(cards, progress, 4, { introduceNew: true, random: createSeededRng(seed) });
      expect(cardIds[0]).toBe('card-0');
    }
  });

  it('only has new cards when the child has met none yet', () => {
    const { cardIds, newCardIds } = buildRound(cards, {}, 5, { introduceNew: true });
    expect(newCardIds).toHaveLength(2);
    expect([...cardIds].sort()).toEqual([...newCardIds].sort());
  });

  it('introduces more new cards in longer rounds', () => {
    expect([5, 10, 20].map(newCardsPerRound)).toEqual([2, 3, 5]);
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

describe('withDefaultSettings', () => {
  it('fills in settings added after a profile was saved', () => {
    const saved = {
      id: 'p1',
      name: 'Ivy',
      avatar: '🦊',
      createdAt: 0,
      settings: { setIds: ['animals'], choiceCount: 3, promptMode: 'mix', roundSize: 10, readAloud: false, soundEffects: true },
    } as unknown as ChildProfile;
    expect(withDefaultSettings(saved).settings).toEqual({ ...saved.settings, introduceNew: true, autoAdjust: true });
  });
});
