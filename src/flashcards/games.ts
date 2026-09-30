import { createSeededRng, shuffle } from './practice';
import { FlashcardData, PracticeSettings } from './types';

export type GameKind = 'memory' | 'listen' | 'odd-one-out';

export const GAME_KINDS: GameKind[] = ['memory', 'listen', 'odd-one-out'];

export const GAME_INFO: Record<GameKind, { name: string; emoji: string; blurb: string }> = {
  memory: { name: 'Memory match', emoji: '🧠', blurb: 'Flip two cards to find the pairs.' },
  listen: { name: 'Listen and find', emoji: '👂', blurb: 'Hear a word, then tap its picture.' },
  'odd-one-out': { name: 'Odd one out', emoji: '🔍', blurb: "Find the picture that doesn't belong." },
};

/** Questions in a round of listen and find or odd one out. */
export const GAME_ROUND = 6;

const normalize = (text: string) => text.trim().toLowerCase();
const frontKey = (card: FlashcardData) => card.imageUrl || card.frontText || card.backgroundColor || card.id;

/** Cards with distinct words and fronts, so no two could be mistaken for each other. */
export function distinctCards(cards: FlashcardData[]) {
  const names = new Set<string>();
  const fronts = new Set<string>();
  return cards.filter((card) => {
    const name = normalize(card.name);
    const front = frontKey(card);
    if (names.has(name) || fronts.has(front)) return false;
    names.add(name);
    fronts.add(front);
    return true;
  });
}

// --- Memory match --------------------------------------------------------------------------------

/** Pairs on the table: more for kids who handle more choices. */
export const memoryPairCount = (settings: Pick<PracticeSettings, 'choiceCount'> | null) =>
  !settings ? 4 : settings.choiceCount <= 2 ? 3 : settings.choiceCount === 3 ? 4 : 6;

/** Toddlers match a picture to the same picture; readers match a picture to its word. */
export const memoryMatchesWords = (settings: Pick<PracticeSettings, 'promptMode'> | null) =>
  settings !== null && settings.promptMode !== 'find-picture';

export type MemoryTile = {
  key: string;
  cardId: string;
  face: 'picture' | 'word';
};

export function buildMemoryDeck(cards: FlashcardData[], pairs: number, withWords: boolean, seed: number): MemoryTile[] {
  const random = createSeededRng(seed);
  const chosen = shuffle(distinctCards(cards), random).slice(0, pairs);
  const tiles = chosen.flatMap((card): MemoryTile[] => [
    { key: `${card.id}-a`, cardId: card.id, face: 'picture' },
    { key: `${card.id}-b`, cardId: card.id, face: withWords ? 'word' : 'picture' },
  ]);
  return shuffle(tiles, random);
}

// --- Listen and find -----------------------------------------------------------------------------

export function pickQuestions(cards: FlashcardData[], count: number, seed: number) {
  return shuffle(distinctCards(cards), createSeededRng(seed)).slice(0, count);
}

// --- Odd one out ---------------------------------------------------------------------------------

/** Pictures from the set in each odd-one-out question: 2 (so 3 to choose from), or 3 for kids ready for 4. */
export const oddOneOutBelonging = (settings: Pick<PracticeSettings, 'choiceCount'> | null) =>
  (settings?.choiceCount ?? 3) >= 4 ? 3 : 2;

export type OddOneOutQuestion = {
  /** The pictures to choose from, in the order shown. */
  items: FlashcardData[];
  oddId: string;
};

/**
 * Questions with a few pictures from this set and one from somewhere else. The odd one never shares a
 * word or picture with this set's cards, so there's always exactly one right answer.
 */
export function buildOddOneOut(
  setCards: FlashcardData[],
  otherCards: FlashcardData[],
  { questions, belonging, seed }: { questions: number; belonging: number; seed: number },
): OddOneOutQuestion[] {
  const random = createSeededRng(seed);
  const members = distinctCards(setCards);
  const memberIds = new Set(setCards.map((card) => card.id));
  const memberNames = new Set(setCards.map((card) => normalize(card.name)));
  const memberFronts = new Set(setCards.map(frontKey));
  const outsiders = distinctCards(
    otherCards.filter(
      (card) => !memberIds.has(card.id) && !memberNames.has(normalize(card.name)) && !memberFronts.has(frontKey(card)),
    ),
  );
  if (members.length < belonging || outsiders.length === 0) return [];

  const odds = shuffle(outsiders, random);
  return Array.from({ length: questions }, (_, index) => {
    const odd = odds[index % odds.length];
    const items = shuffle([...shuffle(members, random).slice(0, belonging), odd], random);
    return { items, oddId: odd.id };
  });
}
