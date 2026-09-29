import { useCallback, useEffect, useState } from 'react';
import { deleteProfile, getProfiles, getProgress, putProfile, putProgress } from '../db/progressDb';
import { applyReviewResult, ProgressByCard } from '../flashcards/review';
import { CardProgress, ChildProfile, FlashcardData } from '../flashcards/types';
import { useLocalStorageState } from './useLocalStorage';

const LEGACY_MIGRATED_KEY = 'kids-flashcards:legacy-progress-migrated';
const NO_PROGRESS: ProgressByCard = {};

// Before children had profiles, progress was saved on each card. Hand it to the first child added.
async function migrateLegacyProgress(profileId: string, cards: FlashcardData[]) {
  try {
    if (window.localStorage.getItem(LEGACY_MIGRATED_KEY)) return;
  } catch {
    // Without localStorage the guard below (first child only) still applies.
  }
  const records: CardProgress[] = cards.flatMap((card) =>
    card.review && card.review.lastReviewedAt !== null ? [{ ...card.review, profileId, cardId: card.id }] : [],
  );
  await putProgress(records);
  try {
    window.localStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
  } catch (error) {
    console.warn('Unable to remember that saved progress was moved', error);
  }
}

export function useChildProfiles(cards: FlashcardData[]) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useLocalStorageState<string | null>(
    'kids-flashcards:active-child',
    null,
  );
  const [progressState, setProgressState] = useState<{ profileId: string | null; byCard: ProgressByCard }>({
    profileId: null,
    byCard: NO_PROGRESS,
  });

  useEffect(() => {
    let cancelled = false;
    getProfiles()
      .then((stored) => {
        if (!cancelled) setProfiles([...stored].sort((a, b) => a.createdAt - b.createdAt));
      })
      .catch((loadError) => {
        console.error('Unable to load children', loadError);
        if (!cancelled) setError('Unable to load your children right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
  const activeId = activeProfile?.id ?? null;

  useEffect(() => {
    if (!activeId) return undefined;
    let cancelled = false;
    getProgress(activeId)
      .then((records) => {
        if (cancelled) return;
        const byCard: ProgressByCard = {};
        records.forEach(({ profileId: _profileId, cardId, ...review }) => {
          byCard[cardId] = review;
        });
        setProgressState({ profileId: activeId, byCard });
      })
      .catch((loadError) => {
        console.error('Unable to load practice progress', loadError);
        if (!cancelled) setError('Unable to load practice progress right now.');
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Only hand out progress that belongs to the child currently selected.
  const progressReady = activeId !== null && progressState.profileId === activeId;
  const progress = progressReady ? progressState.byCard : NO_PROGRESS;

  const saveProfile = useCallback(
    async (profile: ChildProfile) => {
      const isNew = !profiles.some((existing) => existing.id === profile.id);
      await putProfile(profile);
      if (isNew && profiles.length === 0) {
        await migrateLegacyProgress(profile.id, cards);
      }
      setProfiles((current) =>
        isNew ? [...current, profile] : current.map((existing) => (existing.id === profile.id ? profile : existing)),
      );
      if (isNew) setActiveProfileId(profile.id);
    },
    [cards, profiles, setActiveProfileId],
  );

  const removeProfile = useCallback(async (profileId: string) => {
    await deleteProfile(profileId);
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
  }, []);

  const recordAnswer = useCallback(
    async (cardId: string, correct: boolean) => {
      if (!activeId) return;
      const review = applyReviewResult(progress[cardId], correct);
      setProgressState((current) =>
        current.profileId === activeId
          ? { profileId: activeId, byCard: { ...current.byCard, [cardId]: review } }
          : current,
      );
      await putProgress([{ ...review, profileId: activeId, cardId }]);
    },
    [activeId, progress],
  );

  return {
    profiles,
    activeProfile,
    progress,
    progressReady,
    loading,
    error,
    selectProfile: setActiveProfileId,
    saveProfile,
    removeProfile,
    recordAnswer,
  };
}
