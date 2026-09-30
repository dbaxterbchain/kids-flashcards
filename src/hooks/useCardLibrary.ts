import { useCallback, useEffect, useMemo, useState } from 'react';
import { addSetWithCards as addSetWithCardsToDb, deleteCard, deleteSetAndCards, putCard, putSet } from '../db/cardsDb';
import { defaultCards, defaultSets } from '../flashcards/defaultData';
import { newId } from '../flashcards/ids';
import { prepareSetImport, SetPackage, uniqueSetId } from '../flashcards/setPackage';
import { loadCardsAndSets, restoreStarterCards } from '../flashcards/storage';
import { FlashcardData, FlashcardSet } from '../flashcards/types';

const normalizeName = (name: string) => name.trim().toLowerCase();

const STARTER_SET_ORDER = new Map(defaultSets.map((set, index) => [set.id, index]));

export type RemoveSetOptions = {
  /** Also delete the cards that are only in this set. Cards in other sets always stay. */
  deleteCards?: boolean;
};

// Starter sets keep their usual order, and a parent's own sets follow alphabetically, so the order
// is the same every time (the database hands sets back sorted by id).
function sortSets(sets: FlashcardSet[]) {
  return [...sets].sort((a, b) => {
    const aStarter = STARTER_SET_ORDER.get(a.id);
    const bStarter = STARTER_SET_ORDER.get(b.id);
    if (aStarter !== undefined || bStarter !== undefined) {
      return (aStarter ?? Number.MAX_SAFE_INTEGER) - (bStarter ?? Number.MAX_SAFE_INTEGER);
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/** The cards and sets saved on this device, and the ways to change them. */
export function useCardLibrary() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCardsAndSets()
      .then(({ cards: storedCards, sets: storedSets }) => {
        if (cancelled) return;
        setCards(storedCards);
        setSets(storedSets);
      })
      .catch((error) => {
        console.error('Unable to load saved cards', error);
        if (cancelled) return;
        setCards(defaultCards);
        setSets(defaultSets);
        setLoadError('Showing the starter cards because your saved cards could not be read.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveCard = useCallback(async (card: FlashcardData) => {
    await putCard(card);
    setCards((current) =>
      current.some((existing) => existing.id === card.id)
        ? current.map((existing) => (existing.id === card.id ? card : existing))
        : [card, ...current],
    );
  }, []);

  const removeCard = useCallback(async (id: string) => {
    await deleteCard(id);
    setCards((current) => current.filter((card) => card.id !== id));
  }, []);

  // New sets never take a starter set's id, so bringing the starters back can't mix them in.
  const newSetId = useCallback(
    (name: string) => uniqueSetId(name, [...sets.map((set) => set.id), ...STARTER_SET_ORDER.keys()]),
    [sets],
  );

  /** Returns the existing set when one already has this name. */
  const createSet = useCallback(
    async (name: string): Promise<FlashcardSet> => {
      const trimmed = name.trim();
      const existing = sets.find((set) => normalizeName(set.name) === normalizeName(trimmed));
      if (existing) return existing;
      const set = { id: newSetId(trimmed), name: trimmed };
      await putSet(set);
      setSets((current) => [...current, set]);
      return set;
    },
    [sets, newSetId],
  );

  /** Saves a whole new set at once, e.g. one shared by another family or picked from the library. */
  const addSetWithCards = useCallback(async (set: FlashcardSet, newCards: FlashcardData[]) => {
    await addSetWithCardsToDb(set, newCards);
    setSets((current) => [...current.filter((existing) => existing.id !== set.id), set]);
    setCards((current) => {
      const ids = new Set(newCards.map((card) => card.id));
      return [...newCards, ...current.filter((card) => !ids.has(card.id))];
    });
  }, []);

  /** Adds a shared set as a new set with its own copies of the cards. */
  const importSet = useCallback(
    async (pkg: SetPackage) => {
      const { set, cards: newCards } = prepareSetImport(pkg, sets, { setId: newSetId(pkg.name), cardId: newId });
      await addSetWithCards(set, newCards);
      return set;
    },
    [sets, newSetId, addSetWithCards],
  );

  const renameSet = useCallback(async (id: string, name: string) => {
    const set = { id, name: name.trim() };
    await putSet(set);
    setSets((current) => current.map((existing) => (existing.id === id ? set : existing)));
  }, []);

  /** Deletes a set. Its cards stay, just without that set, unless the parent chose to delete them too. */
  const removeSet = useCallback(
    async (id: string, { deleteCards = false }: RemoveSetOptions = {}) => {
      const inSet = cards.filter((card) => card.setIds?.includes(id));
      const deletedIds = new Set(deleteCards ? inSet.filter((card) => card.setIds?.length === 1).map((card) => card.id) : []);
      const updated = new Map(
        inSet
          .filter((card) => !deletedIds.has(card.id))
          .map((card) => [card.id, { ...card, setIds: (card.setIds ?? []).filter((setId) => setId !== id) }]),
      );
      await deleteSetAndCards(id, [...deletedIds], [...updated.values()]);
      setSets((current) => current.filter((set) => set.id !== id));
      setCards((current) =>
        current.filter((card) => !deletedIds.has(card.id)).map((card) => updated.get(card.id) ?? card),
      );
    },
    [cards],
  );

  const restoreStarters = useCallback(async () => {
    const restored = await restoreStarterCards(cards, sets);
    setSets((current) => [...current, ...restored.sets]);
    setCards((current) => [...current, ...restored.cards]);
    return restored;
  }, [cards, sets]);

  const sortedSets = useMemo(() => sortSets(sets), [sets]);

  const missingStarterCount = useMemo(
    () => defaultCards.filter((starter) => !cards.some((card) => card.id === starter.id)).length,
    [cards],
  );

  return {
    cards,
    sets: sortedSets,
    loading,
    loadError,
    saveCard,
    removeCard,
    createSet,
    addSetWithCards,
    importSet,
    renameSet,
    removeSet,
    restoreStarters,
    missingStarterCount,
  };
}
