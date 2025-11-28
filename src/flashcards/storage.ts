import { getAllCards, getAllSets, putCards, putSets } from '../db/cardsDb';
import { defaultCards, defaultSets } from './defaultData';
import { FlashcardData, FlashcardSet } from './types';

export type LoadResult = {
  cards: FlashcardData[];
  sets: FlashcardSet[];
  visibleSetIds: string[];
};

function normalizeCards(cards: FlashcardData[]): FlashcardData[] {
  return cards.map((card) => ({ ...card, setIds: card.setIds ?? [] }));
}

function hasUncategorized(cards: FlashcardData[]) {
  return cards.some((card) => !card.setIds || card.setIds.length === 0);
}

export async function loadCardsAndSets(): Promise<LoadResult> {
  const [storedCards, storedSets] = await Promise.all([getAllCards(), getAllSets()]);

  let setsToUse = storedSets;
  if (setsToUse.length === 0) {
    await putSets(defaultSets);
    setsToUse = defaultSets;
  } else {
    const missingDefaults = defaultSets.filter((set) => !setsToUse.some((s) => s.id === set.id));
    if (missingDefaults.length > 0) {
      await putSets(missingDefaults);
      setsToUse = [...setsToUse, ...missingDefaults];
    }
  }

  let cardsToUse = storedCards;
  if (cardsToUse.length === 0) {
    await putCards(defaultCards);
    cardsToUse = defaultCards;
  } else {
    const existingIds = new Set(cardsToUse.map((card) => card.id));
    const missingDefault = defaultCards.filter((card) => !existingIds.has(card.id));
    if (missingDefault.length > 0) {
      const updated = [...cardsToUse, ...missingDefault];
      await putCards(updated);
      cardsToUse = updated;
    }
  }

  const normalizedCards = normalizeCards(cardsToUse);
  const uncategorized = hasUncategorized(normalizedCards);

  return {
    cards: normalizedCards,
    sets: setsToUse,
    visibleSetIds: [...setsToUse.map((set) => set.id), ...(uncategorized ? ['uncategorized'] : [])],
  };
}
