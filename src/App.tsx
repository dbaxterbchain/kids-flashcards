import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { unlockAudio } from './audio/sound';
import { AppHeader } from './components/AppHeader';
import { CardEditor } from './components/CardEditor';
import { ChildDialog } from './components/ChildDialog';
import { FlashcardGrid } from './components/FlashcardGrid';
import { GalleryControls } from './components/GalleryControls';
import { PracticePanel } from './components/PracticePanel';
import { PracticeSession } from './components/PracticeSession';
import { PwaPromptBanner } from './components/PwaPromptBanner';
import { defaultSets } from './flashcards/defaultData';
import { AVATARS, buildRound, filterCardsForSets, formatTimeUntil } from './flashcards/practice';
import { buildPracticeQueue } from './flashcards/review';
import { ChildProfile, FlashcardData, UNCATEGORIZED_SET_ID } from './flashcards/types';
import { useCardLibrary } from './hooks/useCardLibrary';
import { useChildProfiles } from './hooks/useChildProfiles';
import { useLocalStorageState } from './hooks/useLocalStorage';
import { usePwa } from './hooks/usePwa';

const emptyStateSx = {
  p: 3,
  borderRadius: 2,
  border: '1px dashed',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  textAlign: 'center',
} as const;

type PracticeRound = {
  profileId: string;
  cardIds: string[];
  seed: number;
};

type ChildDialogState = {
  open: boolean;
  key: number;
  profile: ChildProfile | null;
};

type CardEditorState = {
  open: boolean;
  key: number;
  card: FlashcardData | null;
};

export default function App() {
  const library = useCardLibrary();
  const { cards, sets, loading } = library;
  // Hidden (rather than visible) sets are saved so new sets show up by default.
  const [hiddenSetIds, setHiddenSetIds] = useLocalStorageState<string[]>('kids-flashcards:hidden-sets', []);
  const [showActions, setShowActions] = useLocalStorageState('kids-flashcards:show-card-actions', true);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [cardEditor, setCardEditor] = useState<CardEditorState>({ open: false, key: 0, card: null });
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [childDialog, setChildDialog] = useState<ChildDialogState>({ open: false, key: 0, profile: null });

  const { canInstall, promptInstall, updateAvailable, reloadForUpdate, offlineReady, dismissOfflineReady, isOffline } =
    usePwa();

  const {
    profiles,
    activeProfile,
    progress,
    progressReady,
    loading: profilesLoading,
    error: profilesError,
    selectProfile,
    saveProfile,
    removeProfile,
    recordAnswer,
  } = useChildProfiles(cards);

  const shownError = galleryError ?? library.loadError;

  const availableSets = useMemo(() => {
    const base = [...sets];
    const hasUncategorized = cards.some((card) => !card.setIds || card.setIds.length === 0);
    if (hasUncategorized) {
      base.push({ id: UNCATEGORIZED_SET_ID, name: 'No set' });
    }
    return base;
  }, [sets, cards]);

  const visibleSetIds = useMemo(
    () => availableSets.map((set) => set.id).filter((id) => !hiddenSetIds.includes(id)),
    [availableSets, hiddenSetIds],
  );

  const filteredCards = useMemo(() => {
    const sorted = [...cards].sort((a, b) => b.createdAt - a.createdAt);
    return sorted.filter((card) => {
      const cardSets = card.setIds ?? [];
      if (cardSets.length === 0) {
        return !hiddenSetIds.includes(UNCATEGORIZED_SET_ID);
      }
      return cardSets.some((id) => !hiddenSetIds.includes(id));
    });
  }, [cards, hiddenSetIds]);

  const practicePool = useMemo(
    () => (activeProfile ? filterCardsForSets(cards, activeProfile.settings.setIds) : []),
    [cards, activeProfile],
  );
  const practicePlan = useMemo(() => buildPracticeQueue(practicePool, progress), [practicePool, progress]);
  const nextReviewLabel = useMemo(() => {
    if (practicePlan.hasDue || !practicePlan.nextReviewAt) return null;
    return formatTimeUntil(practicePlan.nextReviewAt - Date.now());
  }, [practicePlan.hasDue, practicePlan.nextReviewAt]);
  const practiceSetLabel = useMemo(() => {
    const setIds = activeProfile?.settings.setIds ?? null;
    if (setIds === null) return 'All sets';
    const names = availableSets.filter((set) => setIds.includes(set.id)).map((set) => set.name);
    if (names.length === 0) return 'No sets';
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  }, [activeProfile, availableSets]);
  const roundCards = useMemo(
    () =>
      (round?.cardIds ?? [])
        .map((id) => cards.find((card) => card.id === id))
        .filter((card): card is FlashcardData => Boolean(card)),
    [cards, round],
  );
  const defaultAvatar =
    AVATARS.find((avatar) => !profiles.some((profile) => profile.avatar === avatar.emoji))?.emoji ?? AVATARS[0].emoji;

  const openCardEditor = (card: FlashcardData | null) => setCardEditor({ open: true, key: Date.now(), card });

  const closeCardEditor = () => setCardEditor((current) => ({ ...current, open: false }));

  const handleSaveCard = async (card: FlashcardData) => {
    await library.saveCard(card);
    // Hidden sets are remembered, so make sure the card just saved isn't filtered out of view.
    const cardSetIds = card.setIds && card.setIds.length > 0 ? card.setIds : [UNCATEGORIZED_SET_ID];
    setHiddenSetIds((current) =>
      cardSetIds.some((id) => !current.includes(id)) ? current : current.filter((id) => !cardSetIds.includes(id)),
    );
    closeCardEditor();
  };

  const toggleVisibleSet = (setId: string) => {
    setHiddenSetIds((current) => (current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId]));
  };

  const selectAllVisibleSets = () => setHiddenSetIds([]);

  const clearVisibleSets = () => {
    setHiddenSetIds(availableSets.map((set) => set.id));
  };

  const handleRestoreStarterCards = async () => {
    try {
      await library.restoreStarters();
      const starterSetIds = defaultSets.map((set) => set.id);
      setHiddenSetIds((current) => current.filter((id) => !starterSetIds.includes(id)));
      setGalleryError(null);
    } catch (error) {
      console.error('Unable to restore starter cards', error);
      setGalleryError('Unable to bring back the starter cards right now.');
    }
  };

  const handleDelete = (card: FlashcardData) => {
    const confirmed = window.confirm(`Delete "${card.name}"? This cannot be undone.`);
    if (!confirmed) return;

    library.removeCard(card.id).catch((error) => {
      console.error('Unable to delete card', error);
      setGalleryError('Unable to delete card. Storage might be blocked.');
    });
  };

  const startPractice = () => {
    if (!activeProfile || !progressReady) return;
    // Start is a tap, which is when browsers allow sound to be switched on.
    unlockAudio();
    setPracticeError(null);
    setRound({
      profileId: activeProfile.id,
      cardIds: buildRound(practicePool, progress, activeProfile.settings.roundSize),
      seed: Date.now(),
    });
    window.scrollTo({ top: 0 });
  };

  const exitPractice = () => setRound(null);

  const handleAnswer = (cardId: string, correct: boolean) => {
    recordAnswer(cardId, correct).catch((error) => {
      console.error('Unable to save practice result', error);
      setPracticeError("Couldn't save that answer, so progress may be out of date.");
    });
  };

  const openAddChild = () => setChildDialog({ open: true, key: Date.now(), profile: null });

  const openEditChild = () => {
    if (activeProfile) setChildDialog({ open: true, key: Date.now(), profile: activeProfile });
  };

  const closeChildDialog = () => setChildDialog((current) => ({ ...current, open: false }));

  const handleSaveChild = async (profile: ChildProfile) => {
    await saveProfile(profile);
    closeChildDialog();
  };

  const handleRemoveChild = async (profile: ChildProfile) => {
    if (!window.confirm(`Remove ${profile.name}? Their practice progress will be deleted too.`)) return;
    await removeProfile(profile.id);
    closeChildDialog();
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <PwaPromptBanner
        canInstall={canInstall}
        onInstall={promptInstall}
        updateAvailable={updateAvailable}
        onUpdate={reloadForUpdate}
        offlineReady={offlineReady}
        onDismissOfflineReady={dismissOfflineReady}
        isOffline={isOffline}
      />
      <Container maxWidth={round ? 'md' : 'lg'} sx={{ py: { xs: 2, sm: 4 } }}>
        {round && activeProfile ? (
          <PracticeSession
            key={round.seed}
            profile={activeProfile}
            cards={roundCards}
            pool={practicePool}
            seed={round.seed}
            onAnswer={handleAnswer}
            onRestart={startPractice}
            onExit={exitPractice}
            error={practiceError}
          />
        ) : (
          <>
            <AppHeader />

            <PracticePanel
              profiles={profiles}
              activeProfile={activeProfile}
              loading={loading || profilesLoading}
              readyCount={practicePlan.dueCount}
              poolSize={practicePool.length}
              canStart={practicePool.length >= 2 && progressReady}
              nextReviewLabel={nextReviewLabel}
              setLabel={practiceSetLabel}
              onSelectProfile={selectProfile}
              onAddProfile={openAddChild}
              onEditProfile={openEditChild}
              onStart={startPractice}
              error={profilesError}
            />

            <Box component="section" aria-labelledby="gallery-heading">
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography id="gallery-heading" variant="h5" component="h2" sx={{ fontWeight: 800 }}>
                    Your cards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tap a card to flip it over.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => openCardEditor(null)}
                  sx={{ flexShrink: 0 }}
                >
                  New card
                </Button>
              </Stack>

              {shownError && (
                <Alert severity="warning" onClose={() => setGalleryError(null)} sx={{ mb: 2 }}>
                  {shownError}
                </Alert>
              )}

              <GalleryControls
                availableSets={availableSets}
                visibleSetIds={visibleSetIds}
                onToggleSet={toggleVisibleSet}
                onShowAll={selectAllVisibleSets}
                onHideAll={clearVisibleSets}
                showActions={showActions}
                onToggleActions={setShowActions}
              />

              {loading ? (
                <Typography color="text.secondary" sx={emptyStateSx}>
                  Loading your cards…
                </Typography>
              ) : cards.length === 0 ? (
                <Stack spacing={2} alignItems="center" sx={emptyStateSx}>
                  <Typography>No cards yet. Make your first card, or bring back the starter cards.</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCardEditor(null)}>
                      New card
                    </Button>
                    <Button variant="outlined" onClick={handleRestoreStarterCards}>
                      Bring back starter cards
                    </Button>
                  </Stack>
                </Stack>
              ) : filteredCards.length === 0 ? (
                <Stack spacing={2} alignItems="center" sx={emptyStateSx}>
                  <Typography>No cards in the sets you&apos;re showing.</Typography>
                  <Button variant="outlined" onClick={selectAllVisibleSets}>
                    Show all sets
                  </Button>
                </Stack>
              ) : (
                <FlashcardGrid
                  cards={filteredCards}
                  showActions={showActions}
                  speakOnFlip
                  onEdit={(card) => openCardEditor(card)}
                  onDelete={handleDelete}
                />
              )}
            </Box>
          </>
        )}
      </Container>

      <CardEditor
        key={`card-editor-${cardEditor.key}`}
        open={cardEditor.open}
        card={cardEditor.card}
        sets={sets}
        onClose={closeCardEditor}
        onSave={handleSaveCard}
        onCreateSet={library.createSet}
      />

      <ChildDialog
        key={`child-dialog-${childDialog.key}`}
        open={childDialog.open}
        profile={childDialog.profile}
        defaultAvatar={defaultAvatar}
        sets={availableSets}
        onClose={closeChildDialog}
        onSave={handleSaveChild}
        onRemove={handleRemoveChild}
      />
    </Box>
  );
}
