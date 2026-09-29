import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { unlockAudio } from './audio/sound';
import { AppHeader } from './components/AppHeader';
import { CardForm } from './components/CardForm';
import { ChildDialog } from './components/ChildDialog';
import { FlashcardGrid } from './components/FlashcardGrid';
import { GalleryControls } from './components/GalleryControls';
import { PracticePanel } from './components/PracticePanel';
import { PracticeSession } from './components/PracticeSession';
import { PwaPromptBanner } from './components/PwaPromptBanner';
import { deleteCard, putCard, putSet } from './db/cardsDb';
import { defaultCards, defaultSets } from './flashcards/defaultData';
import { fileToDataUrl, slugifySetName } from './flashcards/fileUtils';
import { AVATARS, buildRound, filterCardsForSets, formatTimeUntil } from './flashcards/practice';
import { buildPracticeQueue } from './flashcards/review';
import { loadCardsAndSets, restoreStarterCards } from './flashcards/storage';
import { ChildProfile, FlashcardData, FlashcardSet, MAX_AUDIO_SECONDS, UNCATEGORIZED_SET_ID } from './flashcards/types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
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

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  // Hidden (rather than visible) sets are saved so new sets show up by default.
  const [hiddenSetIds, setHiddenSetIds] = useLocalStorageState<string[]>('kids-flashcards:hidden-sets', []);
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useLocalStorageState('kids-flashcards:show-card-actions', true);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [round, setRound] = useState<PracticeRound | null>(null);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [childDialog, setChildDialog] = useState<ChildDialogState>({ open: false, key: 0, profile: null });

  const formRef = useRef<HTMLFormElement | null>(null);

  const {
    audioDataUrl,
    setAudioDataUrl,
    recordingError,
    setRecordingError,
    recordingSeconds,
    isRecording,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder(MAX_AUDIO_SECONDS);

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

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const { cards: storedCards, sets: storedSets } = await loadCardsAndSets();
        if (cancelled) return;

        setCards(storedCards);
        setSets(storedSets);
      } catch (error) {
        console.error('Unable to load saved cards', error);
        if (!cancelled) {
          setCards(defaultCards);
          setSets(defaultSets);
          setGalleryError('Showing the starter cards because your saved cards could not be read.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
      resetRecording();
    };
  }, [resetRecording]);

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

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setImageData(null);
    setUploadError(null);
    setSelectedSetIds([]);
    setNewSetName('');
    setBackgroundColor('');
    resetRecording();
    formRef.current?.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setUploadError('Please give your card a fun name!');
      return;
    }
    if (!imageData && !backgroundColor.trim()) {
      setUploadError('Add a picture or pick a background color.');
      return;
    }

    const existingCard = editingId ? cards.find((card) => card.id === editingId) : undefined;
    const normalizedBackground = backgroundColor.trim();
    const payload: FlashcardData = {
      id: editingId ?? (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
      name: name.trim(),
      imageUrl: imageData ?? '',
      createdAt: editingId ? existingCard?.createdAt ?? Date.now() : Date.now(),
      audioUrl: audioDataUrl ?? undefined,
      setIds: selectedSetIds,
      backgroundColor: normalizedBackground || undefined,
      // Kept until it's moved to the first child's progress.
      review: existingCard?.review,
    };

    try {
      await putCard(payload);
      setCards((current) =>
        editingId ? current.map((card) => (card.id === editingId ? payload : card)) : [payload, ...current],
      );
      // Hidden sets are remembered, so make sure the card just saved isn't filtered out of view.
      const cardSetIds = selectedSetIds.length > 0 ? selectedSetIds : [UNCATEGORIZED_SET_ID];
      setHiddenSetIds((current) =>
        cardSetIds.some((id) => !current.includes(id)) ? current : current.filter((id) => !cardSetIds.includes(id)),
      );
      resetForm();
      setCardFormOpen(false);
    } catch (error) {
      console.error('Unable to save card', error);
      setUploadError('Unable to save card. Storage might be full or blocked.');
    }
  };

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageData(dataUrl);
      setUploadError(null);
    } catch (error) {
      console.error(error);
      setUploadError('Something went wrong reading that file.');
    }
  };

  const handleAudioFileChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith('audio/')) {
      setRecordingError('Only audio files are allowed.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setAudioDataUrl(dataUrl);
      setRecordingError(null);
    } catch (error) {
      console.error(error);
      setRecordingError('Unable to read that audio file.');
    }
  };

  const handleToggleSetForCard = (setId: string) => {
    setSelectedSetIds((current) => (current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId]));
  };

  const handleAddSet = async () => {
    const trimmed = newSetName.trim();
    if (!trimmed) return;
    const id = slugifySetName(trimmed);
    if (sets.some((set) => set.id === id)) {
      setSelectedSetIds((current) => (current.includes(id) ? current : [...current, id]));
      setNewSetName('');
      return;
    }
    const set: FlashcardSet = { id, name: trimmed };
    try {
      await putSet(set);
      setSets((current) => [...current, set]);
      setSelectedSetIds((current) => [...current, id]);
      setHiddenSetIds((current) => current.filter((hiddenId) => hiddenId !== id));
      setNewSetName('');
    } catch (error) {
      console.error('Unable to add set', error);
      setUploadError('Unable to add set right now.');
    }
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
      const restored = await restoreStarterCards(cards, sets);
      setSets((current) => [...current, ...restored.sets]);
      setCards((current) => [...current, ...restored.cards]);
      const starterSetIds = defaultSets.map((set) => set.id);
      setHiddenSetIds((current) => current.filter((id) => !starterSetIds.includes(id)));
      setGalleryError(null);
    } catch (error) {
      console.error('Unable to restore starter cards', error);
      setGalleryError('Unable to bring back the starter cards right now.');
    }
  };

  const handleEdit = (card: FlashcardData) => {
    setCardFormOpen(true);
    setEditingId(card.id);
    setName(card.name);
    setImageData(card.imageUrl);
    setAudioDataUrl(card.audioUrl ?? null);
    setSelectedSetIds(card.setIds ?? []);
    setBackgroundColor(card.backgroundColor ?? '');
    setUploadError(null);
  };

  const handleDelete = (id: string) => {
    const cardToDelete = cards.find((card) => card.id === id);
    const confirmed = window.confirm(`Delete "${cardToDelete?.name ?? 'this card'}"? This cannot be undone.`);
    if (!confirmed) return;

    deleteCard(id)
      .then(() => {
        setCards((current) => current.filter((card) => card.id !== id));
        if (editingId === id) {
          resetForm();
        }
      })
      .catch((error) => {
        console.error('Unable to delete card', error);
        setGalleryError('Unable to delete card. Storage might be blocked.');
      });
  };

  const cancelEditing = () => {
    resetForm();
    setCardFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setCardFormOpen(true);
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
                  onClick={openCreateForm}
                  sx={{ flexShrink: 0 }}
                >
                  New card
                </Button>
              </Stack>

              {galleryError && (
                <Alert severity="warning" onClose={() => setGalleryError(null)} sx={{ mb: 2 }}>
                  {galleryError}
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
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
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
                <FlashcardGrid cards={filteredCards} showActions={showActions} onEdit={handleEdit} onDelete={handleDelete} />
              )}
            </Box>
          </>
        )}
      </Container>

      <CardForm
        formRef={formRef}
        name={name}
        onNameChange={setName}
        imageData={imageData}
        uploadError={uploadError}
        editingId={editingId}
        onSubmit={handleSubmit}
        onCancelEdit={cancelEditing}
        onImageFileChange={handleFileChange}
        sets={sets}
        selectedSetIds={selectedSetIds}
        onToggleSet={handleToggleSetForCard}
        newSetName={newSetName}
        onSetNameChange={setNewSetName}
        onAddSet={handleAddSet}
        audioDataUrl={audioDataUrl}
        recordingError={recordingError}
        recordingSeconds={recordingSeconds}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onAudioFileChange={handleAudioFileChange}
        onClearAudio={resetRecording}
        open={cardFormOpen}
        onClose={cancelEditing}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
      />

      <ChildDialog
        key={childDialog.key}
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
