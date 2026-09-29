import { getAllCards, getAllSets, putCards, putSets } from '../db/cardsDb';
import { defaultCards, defaultSets } from './defaultData';
import { ensureReview } from './review';
import { FlashcardData, FlashcardSet } from './types';

export type LoadResult = {
  cards: FlashcardData[];
  sets: FlashcardSet[];
};

type SeededStarters = {
  cards: string[];
  sets: string[];
};

// Starter cards and sets are offered once. Anything a parent deletes afterwards stays deleted,
// while starter content added in a later release still shows up for existing users.
const SEEDED_STARTERS_KEY = 'kids-flashcards:seeded-starters';

const defaultCardsById = new Map(defaultCards.map((card) => [card.id, card]));

function normalizeCards(cards: FlashcardData[]): FlashcardData[] {
  return cards.map((card) => ensureReview({ ...card, setIds: card.setIds ?? [] }));
}

function readSeededStarters(): SeededStarters | null {
  try {
    const stored = window.localStorage.getItem(SEEDED_STARTERS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<SeededStarters>;
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      sets: Array.isArray(parsed.sets) ? parsed.sets : [],
    };
  } catch (error) {
    console.warn('Unable to read which starter cards were added', error);
    return null;
  }
}

function writeSeededStarters(previous: SeededStarters | null) {
  const value: SeededStarters = {
    cards: Array.from(new Set([...(previous?.cards ?? []), ...defaultCards.map((card) => card.id)])),
    sets: Array.from(new Set([...(previous?.sets ?? []), ...defaultSets.map((set) => set.id)])),
  };
  try {
    window.localStorage.setItem(SEEDED_STARTERS_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to remember which starter cards were added', error);
  }
}

// Starter pictures are generated SVGs. When the artwork changes, refresh cards that still use an
// older generated picture; pictures a parent uploaded are left alone.
function upgradeStarterPicture(card: FlashcardData): FlashcardData | null {
  const starter = defaultCardsById.get(card.id);
  if (!starter || !starter.imageUrl || card.imageUrl === starter.imageUrl) return null;
  if (!card.imageUrl.startsWith('data:image/svg+xml,')) return null;
  return { ...card, imageUrl: starter.imageUrl, backgroundColor: card.backgroundColor || starter.backgroundColor };
}

export async function loadCardsAndSets(): Promise<LoadResult> {
  const [storedCards, storedSets] = await Promise.all([getAllCards(), getAllSets()]);
  const seeded = readSeededStarters();
  const seededCardIds = new Set(seeded?.cards ?? []);
  const seededSetIds = new Set(seeded?.sets ?? []);
  const storedCardIds = new Set(storedCards.map((card) => card.id));
  const storedSetIds = new Set(storedSets.map((set) => set.id));

  const newSets = defaultSets.filter((set) => !storedSetIds.has(set.id) && !seededSetIds.has(set.id));
  const newCards = defaultCards.filter((card) => !storedCardIds.has(card.id) && !seededCardIds.has(card.id));
  const upgradedCards = new Map<string, FlashcardData>();
  storedCards.forEach((card) => {
    const upgraded = upgradeStarterPicture(card);
    if (upgraded) upgradedCards.set(card.id, upgraded);
  });

  if (newSets.length > 0) {
    await putSets(newSets);
  }
  if (newCards.length > 0 || upgradedCards.size > 0) {
    await putCards([...newCards, ...upgradedCards.values()]);
  }
  writeSeededStarters(seeded);

  const cards = [...storedCards.map((card) => upgradedCards.get(card.id) ?? card), ...newCards];
  return {
    cards: normalizeCards(cards),
    sets: [...storedSets, ...newSets],
  };
}

// Adds back any starter cards and sets that were deleted.
export async function restoreStarterCards(existingCards: FlashcardData[], existingSets: FlashcardSet[]) {
  const cardIds = new Set(existingCards.map((card) => card.id));
  const setIds = new Set(existingSets.map((set) => set.id));
  const sets = defaultSets.filter((set) => !setIds.has(set.id));
  const cards = normalizeCards(defaultCards.filter((card) => !cardIds.has(card.id)));

  if (sets.length > 0) await putSets(sets);
  if (cards.length > 0) await putCards(cards);
  return { cards, sets };
}
