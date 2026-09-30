import { describe, expect, it } from 'vitest';
import { buildMemoryDeck, buildOddOneOut, distinctCards, memoryPairCount, memoryMatchesWords, pickQuestions } from './games';
import { testCard } from './testCards';

const animals = ['Cow', 'Pig', 'Sheep', 'Goat', 'Horse', 'Duck', 'Hen', 'Cat'].map((name) =>
  testCard(name.toLowerCase(), { name, frontText: name[0], setIds: ['farm'] }),
);
const fruits = ['Apple', 'Pear', 'Plum'].map((name) => testCard(name.toLowerCase(), { name, frontText: `${name}!`, setIds: ['fruit'] }));

describe('memory match', () => {
  it('sizes the game to the child', () => {
    expect([2, 3, 4].map((choiceCount) => memoryPairCount({ choiceCount }))).toEqual([3, 4, 6]);
    expect(memoryPairCount(null)).toBe(4);
    expect(memoryMatchesWords({ promptMode: 'find-picture' })).toBe(false);
    expect(memoryMatchesWords({ promptMode: 'mix' })).toBe(true);
  });

  it('deals two tiles for each chosen card', () => {
    const deck = buildMemoryDeck(animals, 4, true, 7);
    expect(deck).toHaveLength(8);
    const counts = new Map<string, number>();
    deck.forEach((tile) => counts.set(tile.cardId, (counts.get(tile.cardId) ?? 0) + 1));
    expect([...counts.values()]).toEqual([2, 2, 2, 2]);
    expect(deck.filter((tile) => tile.face === 'word')).toHaveLength(4);
    expect(new Set(deck.map((tile) => tile.key)).size).toBe(8);
  });

  it('never deals two cards with the same word or picture', () => {
    const twins = [testCard('a', { name: 'Dog', frontText: '🐶' }), testCard('b', { name: 'dog', frontText: '🐕' }), testCard('c', { name: 'Pup', frontText: '🐶' })];
    expect(distinctCards(twins).map((card) => card.id)).toEqual(['a']);
  });
});

describe('listen and find', () => {
  it('picks different cards each question', () => {
    const questions = pickQuestions(animals, 6, 3);
    expect(questions).toHaveLength(6);
    expect(new Set(questions.map((card) => card.id)).size).toBe(6);
  });
});

describe('odd one out', () => {
  it('mixes cards from the set with one that does not belong', () => {
    const questions = buildOddOneOut(animals, [...animals, ...fruits], { questions: 6, belonging: 3, seed: 11 });
    expect(questions).toHaveLength(6);
    for (const { items, oddId } of questions) {
      expect(items).toHaveLength(4);
      expect(items.filter((card) => card.setIds?.includes('farm'))).toHaveLength(3);
      expect(fruits.map((card) => card.id)).toContain(oddId);
      expect(items.map((card) => card.id)).toContain(oddId);
    }
  });

  it('never uses an odd one that looks or sounds like a card in the set', () => {
    const lookalike = testCard('toy-cow', { name: 'cow', frontText: 'X', setIds: ['toys'] });
    const questions = buildOddOneOut(animals, [lookalike, fruits[0]], { questions: 3, belonging: 2, seed: 1 });
    expect(questions.every((question) => question.oddId === 'apple')).toBe(true);
  });

  it('needs enough cards in the set and something else to compare', () => {
    expect(buildOddOneOut(animals.slice(0, 2), fruits, { questions: 3, belonging: 3, seed: 1 })).toEqual([]);
    expect(buildOddOneOut(animals, animals, { questions: 3, belonging: 3, seed: 1 })).toEqual([]);
  });
});
