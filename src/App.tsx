import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Flashcard, FlashcardData } from './components/Flashcard';
import { deleteCard, getAllCards, putCard, putCards } from './db/cardsDb';

const starterCards: FlashcardData[] = [
  {
    id: 'sunshine',
    name: 'Sun',
    imageUrl: buildSvgCard('Sun', '#ffb347', '#ffcc33'),
    createdAt: Date.now(),
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    imageUrl: buildSvgCard('Rainbow', '#7d7aff', '#ff7eb6'),
    createdAt: Date.now() + 1,
  },
  {
    id: 'dino',
    name: 'Dinosaur',
    imageUrl: buildSvgCard('Dino', '#7de0d5', '#6dd5ed'),
    createdAt: Date.now() + 2,
  },
];

const MAX_AUDIO_SECONDS = 10;

function buildSvgCard(label: string, startColor: string, endColor: string) {
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="260">
      <defs>
        <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${startColor}" />
          <stop offset="100%" stop-color="${endColor}" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" rx="28" fill="url(#grad)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#1f1f1f" font-family="'Baloo 2', 'Comic Sans MS', cursive" font-size="64" font-weight="800">${label}</text>
    </svg>
  `);
  return `data:image/svg+xml,${encoded}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [name, setName] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const ignoreRecordingRef = useRef(false);

  const stopRecording = (silent = false) => {
    if (silent) {
      ignoreRecordingRef.current = true;
    }
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (!silent) {
      setIsRecording(false);
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setImageData(null);
    setUploadError(null);
    setAudioDataUrl(null);
    setRecordingError(null);
    setRecordingSeconds(0);
    stopRecording(true);
    formRef.current?.reset();
  };

  const sortedCards = useMemo(
    () => {
      console.log('Sorting cards');
      return [...cards].sort((a, b) => b.createdAt - a.createdAt);
    },
    [cards],
  );

  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      try {
        const stored = await getAllCards();
        if (!cancelled) {
          if (stored.length === 0) {
            await putCards(starterCards);
            setCards(starterCards);
          } else {
            setCards(stored);
          }
        }
      } catch (error) {
        console.error('Failed to load cards from IndexedDB', error);
        if (!cancelled) {
          setCards(starterCards);
          setUploadError('Using starter cards; could not read saved cards.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCards();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => stopRecording(true), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setUploadError('Please give your card a fun name!');
      return;
    }
    if (!imageData) {
      setUploadError('Please add a picture for your flashcard.');
      return;
    }

    try {
      if (editingId) {
        const updatedCard: FlashcardData = {
          id: editingId,
          name: name.trim(),
          imageUrl: imageData,
          createdAt:
            cards.find((card) => card.id === editingId)?.createdAt ?? Date.now(),
          audioUrl: audioDataUrl ?? undefined,
        };
        await putCard(updatedCard);
        setCards((current) =>
          current.map((card) => (card.id === editingId ? updatedCard : card)),
        );
      } else {
        const newCard: FlashcardData = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
          name: name.trim(),
          imageUrl: imageData,
          createdAt: Date.now(),
          audioUrl: audioDataUrl ?? undefined,
        };
        await putCard(newCard);
        setCards((current) => [newCard, ...current]);
      }
      resetForm();
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

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        if (ignoreRecordingRef.current) {
          ignoreRecordingRef.current = false;
          return;
        }
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        try {
          const dataUrl = await blobToDataUrl(blob);
          setAudioDataUrl(dataUrl);
          setRecordingError(null);
        } catch (error) {
          console.error(error);
          setRecordingError('Unable to save the recording.');
        } finally {
          setIsRecording(false);
          setRecordingSeconds((seconds) => Math.min(seconds, MAX_AUDIO_SECONDS));
          if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
          }
        }
      };

      ignoreRecordingRef.current = false;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordingError(null);
      mediaRecorderRef.current = recorder;
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => Math.min(MAX_AUDIO_SECONDS, seconds + 1));
      }, 1000);
      recordingTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_AUDIO_SECONDS * 1000);
    } catch (error) {
      console.error(error);
      setRecordingError('Microphone permission denied or unavailable.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
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
      setRecordingSeconds(0);
    } catch (error) {
      console.error(error);
      setRecordingError('Unable to read that audio file.');
    }
  };

  const handleEdit = (card: FlashcardData) => {
    setEditingId(card.id);
    setName(card.name);
    setImageData(card.imageUrl);
    setAudioDataUrl(card.audioUrl ?? null);
    setUploadError(null);
  };

  const handleDelete = (id: string) => {
    const cardToDelete = cards.find((card) => card.id === id);
    const confirmed = window.confirm(
      `Delete "${cardToDelete?.name ?? 'this card'}"? This cannot be undone.`,
    );
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

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="tag">Spark curiosity</p>
          <h1>Kids Flashcards</h1>
          <p className="lede">
            Flip lively, colorful cards to help kids remember words and ideas. Add your own pictures to make the deck feel personal and fun!
          </p>
          <ul className="feature-list">
            <li>Flip animations on every card</li>
            <li>Custom pictures from your device</li>
            <li>Save cards locally for quick reuse</li>
          </ul>
        </div>
        <div className="sparkle" aria-hidden>
          <div className="bubble bubble-1" />
          <div className="bubble bubble-2" />
          <div className="bubble bubble-3" />
        </div>
      </header>

      <section className="card-maker">
        <div className="card-maker__panel">
          <h2>{editingId ? 'Edit your flashcard' : 'Make a new flashcard'}</h2>
          <p className="form-hint">
            {editingId ? 'Update the details and save changes.' : 'Give it a name and pick a picture.'}
          </p>
          <form ref={formRef} onSubmit={handleSubmit} className="card-form">
            <label className="field">
              <span>Card name</span>
              <input
                type="text"
                name="name"
                placeholder="e.g. Spaceship"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Picture</span>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={(event) => handleFileChange(event.target.files)}
              />
            </label>

            <div className="audio-card">
              <div className="audio-card__header">
                <span>Optional audio (plays on flip)</span>
                <p className="audio-card__hint">Record or upload a short sound, up to {MAX_AUDIO_SECONDS} seconds.</p>
              </div>
              <div className="audio-actions-row">
                <button
                  type="button"
                  className={`ghost ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording
                    ? `Stop recording (${recordingSeconds}s / ${MAX_AUDIO_SECONDS}s)`
                    : 'Record audio'}
                </button>
                <span className="audio-timer">
                  {recordingSeconds}s / {MAX_AUDIO_SECONDS}s
                </span>
              </div>
              <label className="field file-inline">
                <span>Upload audio (optional)</span>
                <input
                  type="file"
                  name="audio"
                  accept="audio/*"
                  onChange={(event) => handleAudioFileChange(event.target.files)}
                />
              </label>
              {audioDataUrl && (
                <div className="preview-audio">
                  <audio controls src={audioDataUrl} />
                  <button type="button" className="ghost" onClick={() => setAudioDataUrl(null)}>
                    Remove audio
                  </button>
                </div>
              )}
              {recordingError && <p className="error">{recordingError}</p>}
            </div>

            {imageData && (
              <div className="preview">
                <p>Preview</p>
                <div className="preview-card">
                  <img src={imageData} alt="Uploaded preview" />
                </div>
              </div>
            )}

            {uploadError && <p className="error">{uploadError}</p>}

            <div className="form-actions">
              {editingId && (
                <button type="button" className="ghost" onClick={cancelEditing}>
                  Cancel edit
                </button>
              )}
              <button type="submit" className="cta">
                {editingId ? 'Save changes' : 'Add card'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="gallery">
        <div className="gallery__header">
          <div>
            <p className="tag">Flip & learn</p>
            <h2>Flashcard gallery</h2>
          </div>
          <p className="gallery__hint">Click any card to flip it around.</p>
        </div>
        <div className="gallery__controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showActions}
              onChange={(event) => setShowActions(event.target.checked)}
            />
            <span>Show edit & delete buttons</span>
          </label>
        </div>
        {loading ? (
          <p className="empty">Loading your saved cards…</p>
        ) : sortedCards.length === 0 ? (
          <p className="empty">Add your first card to get started!</p>
        ) : (
          <div className="grid">
            {sortedCards.map((card) => (
              <Flashcard
                key={card.id}
                card={card}
                showActions={showActions}
                onEdit={() => handleEdit(card)}
                onDelete={() => handleDelete(card.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

