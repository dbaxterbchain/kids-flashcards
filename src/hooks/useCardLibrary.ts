import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteCard, deleteSet, putCard, putCards, putSet } from '../db/cardsDb';
import { defaultCards, defaultSets } from '../flashcards/defaultData';
import { slugifySetName } from '../flashcards/fileUtils';
import { loadCardsAndSets, restoreStarterCards } from '../flashcards/storage';
import { FlashcardData, FlashcardSet, UNCATEGORIZED_SET_ID } from '../flashcards/types';

const normalizeName = (name: string) => name.trim().toLowerCase();

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

  /** Returns the existing set when one already has this name. */
  const createSet = useCallback(
    async (name: string): Promise<FlashcardSet> => {
      const trimmed = name.trim();
      const existing = sets.find((set) => normalizeName(set.name) === normalizeName(trimmed));
      if (existing) return existing;
      const base = slugifySetName(trimmed);
      const taken = new Set([...sets.map((set) => set.id), UNCATEGORIZED_SET_ID]);
      let id = base;
      for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
      const set = { id, name: trimmed };
      await putSet(set);
      setSets((current) => [...current, set]);
      return set;
    },
    [sets],
  );

  const renameSet = useCallback(async (id: string, name: string) => {
    const set = { id, name: name.trim() };
    await putSet(set);
    setSets((current) => current.map((existing) => (existing.id === id ? set : existing)));
  }, []);

  /** Deletes a set. Its cards stay; they just aren't in that set anymore. */
  const removeSet = useCallback(
    async (id: string) => {
      const updated = cards
        .filter((card) => card.setIds?.includes(id))
        .map((card) => ({ ...card, setIds: (card.setIds ?? []).filter((setId) => setId !== id) }));
      await deleteSet(id);
      if (updated.length > 0) await putCards(updated);
      setSets((current) => current.filter((set) => set.id !== id));
      setCards((current) => current.map((card) => updated.find((changed) => changed.id === card.id) ?? card));
    },
    [cards],
  );

  const restoreStarters = useCallback(async () => {
    const restored = await restoreStarterCards(cards, sets);
    setSets((current) => [...current, ...restored.sets]);
    setCards((current) => [...current, ...restored.cards]);
    return restored;
  }, [cards, sets]);

  const missingStarterCount = useMemo(
    () => defaultCards.filter((starter) => !cards.some((card) => card.id === starter.id)).length,
    [cards],
  );

  return {
    cards,
    sets,
    loading,
    loadError,
    saveCard,
    removeCard,
    createSet,
    renameSet,
    removeSet,
    restoreStarters,
    missingStarterCount,
  };
}
