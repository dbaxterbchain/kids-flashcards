import AddIcon from '@mui/icons-material/Add';
import { Box, Container, Fab, Grid, Typography } from '@mui/material';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CardForm } from './components/CardForm';
import { FlashcardGrid } from './components/FlashcardGrid';
import { GalleryControls } from './components/GalleryControls';
import { Hero } from './components/Hero';
import { PracticePanel } from './components/PracticePanel';
import { PracticeSetDialog } from './components/PracticeSetDialog';
import { PwaPromptBanner } from './components/PwaPromptBanner';
import { deleteCard, putCard, putSet } from './db/cardsDb';
import { defaultCards, defaultSets } from './flashcards/defaultData';
import { fileToDataUrl, slugifySetName } from './flashcards/fileUtils';
import { applyReviewResult, buildPracticeQueue, createInitialReview } from './flashcards/review';
import { loadCardsAndSets } from './flashcards/storage';
import { FlashcardData, FlashcardSet, MAX_AUDIO_SECONDS } from './flashcards/types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { usePwa } from './hooks/usePwa';

const formatDistance = (ms: number) => {
  if (ms <= 0) return 'now';
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const createSeededRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const buildOptions = (correctCard: FlashcardData, pool: FlashcardData[], count: number, seed: number) => {
  const rng = createSeededRng(seed);
  const unique = new Map<string, FlashcardData>();
  unique.set(correctCard.id, correctCard);
  const candidates = pool.filter((card) => card.id !== correctCard.id);
  while (unique.size < Math.min(count, pool.length) && candidates.length > 0) {
    const index = Math.floor(rng() * candidates.length);
    const [picked] = candidates.splice(index, 1);
    if (picked) unique.set(picked.id, picked);
  }
  const options = Array.from(unique.values());
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
};

const filterCardsForPractice = (cards: FlashcardData[], selectedSetIds: string[]) => {
  if (selectedSetIds.length === 0) return [];
  const includeUncategorized = selectedSetIds.includes('uncategorized');
  return cards.filter((card) => {
    const setIds = card.setIds ?? [];
    if (setIds.length === 0) return includeUncategorized;
    return setIds.some((setId) => selectedSetIds.includes(setId));
  });
};

const shuffleIds = (ids: string[]) => {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [visibleSetIds, setVisibleSetIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceSessionIds, setPracticeSessionIds] = useState<string[]>([]);
  const [practiceSessionSeed, setPracticeSessionSeed] = useState(0);
  const [practicePromptMode, setPracticePromptMode] = useState<'image' | 'word' | 'alternate'>('alternate');
  const [practiceReveal, setPracticeReveal] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [practiceSelectedId, setPracticeSelectedId] = useState<string | null>(null);
  const [practiceLocked, setPracticeLocked] = useState(false);
  const [practiceSetDialogOpen, setPracticeSetDialogOpen] = useState(false);
  const [practiceSetIds, setPracticeSetIds] = useState<string[]>([]);
  const [practiceSetError, setPracticeSetError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const { cards: storedCards, sets: storedSets, visibleSetIds: defaults } = await loadCardsAndSets();
        if (cancelled) return;

        setCards(storedCards);
        setSets(storedSets);
        setVisibleSetIds(defaults);
      } catch (error) {
        console.error('Unable to load saved cards', error);
        if (!cancelled) {
          setCards(defaultCards);
          setSets(defaultSets);
          setVisibleSetIds(defaultSets.map((set) => set.id));
          setUploadError('Using starter cards; could not read saved cards.');
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
      base.push({ id: 'uncategorized', name: 'No set' });
    }
    return base;
  }, [sets, cards]);

  useEffect(() => {
    setPracticeSetIds((current) => {
      const availableIds = availableSets.map((set) => set.id);
      if (current.length === 0) {
        return availableIds;
      }
      const filtered = current.filter((id) => availableIds.includes(id));
      return filtered.length === 0 ? availableIds : filtered;
    });
  }, [availableSets]);

  const filteredCards = useMemo(() => {
    if (visibleSetIds.length === 0) return [];

    const sorted = [...cards].sort((a, b) => b.createdAt - a.createdAt);
    return sorted.filter((card) => {
      const cardSets = card.setIds ?? [];
      if (cardSets.length === 0) {
        return visibleSetIds.includes('uncategorized');
      }
      return cardSets.some((id) => visibleSetIds.includes(id));
    });
  }, [cards, visibleSetIds]);

  const practiceCards = useMemo(() => filterCardsForPractice(cards, practiceSetIds), [cards, practiceSetIds]);
  const practiceSetLabel = useMemo(() => {
    if (practiceSetIds.length === 0) return null;
    const names = availableSets
      .filter((set) => practiceSetIds.includes(set.id))
      .map((set) => set.name);
    if (names.length === 0) return null;
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  }, [availableSets, practiceSetIds]);
  const practicePlan = useMemo(() => buildPracticeQueue(practiceCards), [practiceCards]);
  const practiceQueue = practicePlan.queue;
  const practiceSessionCards = useMemo(
    () =>
      practiceSessionIds
        .map((id) => cards.find((card) => card.id === id))
        .filter((card): card is FlashcardData => Boolean(card)),
    [cards, practiceSessionIds],
  );
  const practiceCard = practiceSessionCards[practiceIndex] ?? null;
  const practicePromptSide = useMemo(() => {
    if (practicePromptMode === 'alternate') {
      return practiceIndex % 2 === 0 ? 'image' : 'word';
    }
    return practicePromptMode;
  }, [practicePromptMode, practiceIndex]);
  const practiceFlipped = practicePromptSide === 'word' ? !practiceReveal : practiceReveal;
  const practiceOptions = useMemo(() => {
    if (!practiceMode || !practiceCard) return [];
    const pool = practiceCards.length > 0 ? practiceCards : practiceQueue;
    const seedBase = practiceSessionSeed || 1;
    const promptOffset = practicePromptSide === 'word' ? 17 : 0;
    const seed = seedBase + hashString(practiceCard.id) + promptOffset;
    return buildOptions(practiceCard, pool, 4, seed);
  }, [practiceMode, practiceCard, practicePromptSide, practiceQueue, practiceCards, practiceSessionSeed]);
  const progressLabel = practiceSessionCards.length > 0 ? `${practiceIndex + 1} / ${practiceSessionCards.length}` : null;
  const progressValue =
    practiceSessionCards.length > 0 ? ((practiceIndex + 1) / practiceSessionCards.length) * 100 : null;
  const nextDueLabel = useMemo(() => {
    if (practicePlan.hasDue || !practicePlan.nextReviewAt) return null;
    return formatDistance(practicePlan.nextReviewAt - Date.now());
  }, [practicePlan.hasDue, practicePlan.nextReviewAt]);

  useEffect(() => {
    if (!practiceMode) return;
    if (practiceIndex >= practiceSessionCards.length) {
      setPracticeIndex(0);
    }
  }, [practiceMode, practiceIndex, practiceSessionCards.length]);

  useEffect(() => {
    if (!practiceMode) return;
    setPracticeReveal(false);
    setPracticeFeedback(null);
    setPracticeSelectedId(null);
    setPracticeLocked(false);
  }, [practiceMode, practiceCard?.id, practicePromptSide]);

  useEffect(() => {
    if (!practiceFeedback) return;
    const timeout = window.setTimeout(() => {
      setPracticeFeedback(null);
      setPracticeReveal(false);
      setPracticeSelectedId(null);
      setPracticeLocked(false);
      setPracticeIndex((current) => {
        const length = practiceSessionCards.length;
        if (length === 0) return 0;
        return (current + 1) % length;
      });
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [practiceFeedback, practiceSessionCards.length]);

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
      review: existingCard?.review ?? createInitialReview(),
    };

    try {
      await putCard(payload);
      setCards((current) =>
        editingId ? current.map((card) => (card.id === editingId ? payload : card)) : [payload, ...current],
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
      setVisibleSetIds((current) => [...current, id]);
      setNewSetName('');
    } catch (error) {
      console.error('Unable to add set', error);
      setUploadError('Unable to add set right now.');
    }
  };

  const toggleVisibleSet = (setId: string) => {
    setVisibleSetIds((current) => (current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId]));
  };

  const selectAllVisibleSets = () => {
    setVisibleSetIds(availableSets.map((set) => set.id));
  };

  const clearVisibleSets = () => setVisibleSetIds([]);

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
        setUploadError('Unable to delete card. Storage might be blocked.');
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

  const openPracticeSetDialog = () => {
    setPracticeSetDialogOpen(true);
    setPracticeSetError(null);
  };

  const startPractice = () => {
    const queue = buildPracticeQueue(practiceCards).queue;
    setPracticeSessionIds(shuffleIds(queue.map((card) => card.id)));
    setPracticeSessionSeed(Date.now());
    setPracticeIndex(0);
    setPracticeError(null);
    setPracticeReveal(false);
    setPracticeFeedback(null);
    setPracticeSelectedId(null);
    setPracticeLocked(false);
    setPracticeMode(true);
  };

  const exitPractice = () => {
    setPracticeMode(false);
    setPracticeIndex(0);
    setPracticeError(null);
    setPracticeSessionIds([]);
    setPracticeSessionSeed(0);
    setPracticeReveal(false);
    setPracticeFeedback(null);
    setPracticeSelectedId(null);
    setPracticeLocked(false);
  };

  const togglePracticeSet = (setId: string) => {
    setPracticeSetIds((current) =>
      current.includes(setId) ? current.filter((id) => id !== setId) : [...current, setId],
    );
  };

  const handleSelectAllPracticeSets = () => {
    setPracticeSetIds(availableSets.map((set) => set.id));
  };

  const handleClearPracticeSets = () => {
    setPracticeSetIds([]);
  };

  const handleConfirmPracticeSets = () => {
    if (practiceSetIds.length === 0) {
      setPracticeSetError('Select at least one set to practice.');
      return;
    }
    setPracticeSetDialogOpen(false);
    setPracticeSetError(null);
    startPractice();
  };

  const handlePracticeSelect = async (selectedId: string) => {
    if (!practiceCard || practiceLocked) return;
    const correct = selectedId === practiceCard.id;
    setPracticeSelectedId(selectedId);
    setPracticeReveal(true);
    setPracticeFeedback(correct ? 'correct' : 'incorrect');
    setPracticeLocked(true);
    const updated = applyReviewResult(practiceCard, correct);
    try {
      await putCard(updated);
      setCards((current) => current.map((card) => (card.id === updated.id ? updated : card)));
      setPracticeError(null);
    } catch (error) {
      console.error('Unable to save practice result', error);
      setPracticeError('Unable to save your result right now.');
    }
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Hero />

        <section className="gallery">
          <Grid
            container
            spacing={1.5}
            justifyItems={{ xs: "space-between" }}
            alignItems={{ sm: 'center' }}
            className="gallery__header"
          >
            <Grid size={{xs: 10, sm: 4}}>
              <p className="tag">Flip & learn</p>
              <Typography variant="h4" component="h2">
                Flashcard gallery
              </Typography>
            </Grid>
            <Grid order={{ xs: 3, sm: 2}} size={{xs: 12, sm: 4}}>
              <Typography className="gallery__hint" sx={{ textAlign: 'center', flexGrow: 1 }}>
                Click any card to flip it around.
              </Typography>
            </Grid>
            <Grid order={{ xs: 2, sm: 3}} size={{xs: 2, sm: 4}} sx={{ display: 'flex', justifyContent: 'flex-end'}}>
              <Fab color="primary" aria-label="Add new flashcard" onClick={openCreateForm} size="medium">
                <AddIcon />
              </Fab>
            </Grid>
          </Grid>

          <PracticePanel
            enabled={practiceMode}
            hasDue={practicePlan.hasDue}
            dueCount={practicePlan.dueCount}
            totalCount={practiceMode ? practiceSessionCards.length : practiceQueue.length}
            nextDueLabel={nextDueLabel}
            card={practiceCard}
            isFlipped={practiceFlipped}
            promptSide={practicePromptSide}
            promptMode={practicePromptMode}
            onPromptModeChange={setPracticePromptMode}
            options={practiceOptions}
            selectedOptionId={practiceSelectedId}
            locked={practiceLocked}
            feedback={practiceFeedback}
            canStart={availableSets.length > 0}
            selectedSetLabel={practiceSetLabel}
            progressValue={progressValue}
            onStart={openPracticeSetDialog}
            onExit={exitPractice}
            onSelectOption={handlePracticeSelect}
            progressLabel={progressLabel}
            error={practiceError}
          />

          {!practiceMode && (
            <GalleryControls
              availableSets={availableSets}
              visibleSetIds={visibleSetIds}
              onToggleSet={toggleVisibleSet}
              onShowAll={selectAllVisibleSets}
              onHideAll={clearVisibleSets}
              showActions={showActions}
              onToggleActions={setShowActions}
            />
          )}

          {loading ? (
            <p className="empty">Loading your saved cards.</p>
          ) : practiceMode ? null : filteredCards.length === 0 ? (
            <p className="empty">Add a card or pick a set to get started!</p>
          ) : (
            <FlashcardGrid cards={filteredCards} showActions={showActions} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </section>
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

      <PracticeSetDialog
        open={practiceSetDialogOpen}
        sets={availableSets}
        selectedSetIds={practiceSetIds}
        onToggleSet={togglePracticeSet}
        onSelectAll={handleSelectAllPracticeSets}
        onClearAll={handleClearPracticeSets}
        onClose={() => setPracticeSetDialogOpen(false)}
        onConfirm={handleConfirmPracticeSets}
        error={practiceSetError}
      />
    </Box>
  );
}
