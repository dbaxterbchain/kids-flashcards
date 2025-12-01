import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CardForm } from './components/CardForm';
import { FlashcardGrid } from './components/FlashcardGrid';
import { GalleryControls } from './components/GalleryControls';
import { Hero } from './components/Hero';
import { PwaPromptBanner } from './components/PwaPromptBanner';
import { deleteCard, putCard, putSet } from './db/cardsDb';
import { defaultCards, defaultSets } from './flashcards/defaultData';
import { fileToDataUrl, slugifySetName } from './flashcards/fileUtils';
import { loadCardsAndSets } from './flashcards/storage';
import { FlashcardData, FlashcardSet, MAX_AUDIO_SECONDS } from './flashcards/types';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { usePwa } from './hooks/usePwa';

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [visibleSetIds, setVisibleSetIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [cardFormOpen, setCardFormOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');

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
      // Load cards and sets from IndexedDB
      try {
        const { cards: storedCards, sets: storedSets, visibleSetIds: defaults } = await loadCardsAndSets();
        if (cancelled) return;

        setCards(storedCards);
        setSets(storedSets);
        setVisibleSetIds(defaults);
      } catch (error) {
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
  }, []);

  const availableSets = useMemo(() => {
    const base = [...sets];
    const hasUncategorized = cards.some((card) => !card.setIds || card.setIds.length === 0);
    if (hasUncategorized) {
      base.push({ id: 'uncategorized', name: 'No set' });
    }
    return base;
  }, [sets, cards]);

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
    setVisibleSetIds((current) => (current.includes(setId) 
    ? current.filter((id) => id !== setId) 
    : [...current, setId]));
  };

  const selectAllVisibleSets = () => {
    console.log('Selecting all sets');
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
  };

  useEffect(() => {
    if (!cardFormOpen || !editingId) return;
    const scrollTarget = formRef.current ?? (document.querySelector('.card-maker') as HTMLElement | null);
    scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'start'});
  }, [editingId, cardFormOpen]);

  return (
    <div className="page">
      <PwaPromptBanner
        canInstall={canInstall}
        onInstall={promptInstall}
        updateAvailable={updateAvailable}
        onUpdate={reloadForUpdate}
        offlineReady={offlineReady}
        onDismissOfflineReady={dismissOfflineReady}
        isOffline={isOffline}
      />
      <Hero />

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
        isOpen={cardFormOpen}
        onToggleOpen={() => setCardFormOpen((open) => !open)}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
      />

      <section className="gallery">
        <div className="gallery__header">
          <div>
            <p className="tag">Flip & learn</p>
            <h2>Flashcard gallery</h2>
          </div>
          <p className="gallery__hint">Click any card to flip it around.</p>
        </div>

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
          <p className="empty">Loading your saved cards.</p>
        ) : filteredCards.length === 0 ? (
          <p className="empty">Add a card or pick a set to get started!</p>
        ) : (
          <FlashcardGrid cards={filteredCards} showActions={showActions} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
