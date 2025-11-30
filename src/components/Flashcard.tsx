import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { FlashcardData } from '../flashcards/types';
import './Flashcard.css';

type FlashcardProps = {
  card: FlashcardData;
  showActions?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function Flashcard({ card, showActions = true, onEdit, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frontStyle = card.backgroundColor ? { background: card.backgroundColor } : undefined;

  const toggleFlip = () => setIsFlipped((current) => !current);
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  useEffect(() => {
    if (!card.audioUrl) return undefined;
    const audio = new Audio(card.audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [card.audioUrl]);

  useEffect(() => {
    if (!isFlipped || muted || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setPlayError(null))
      .catch((error) => {
        console.warn('Audio play blocked', error);
        setPlayError('Tap play to hear audio');
      });
  }, [isFlipped, muted]);

  const handleManualPlay = (event: MouseEvent) => {
    event.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setPlayError(null))
      .catch((error) => {
        console.warn('Audio play blocked', error);
        setPlayError('Tap play to hear audio');
      });
  };

  return (
    <div
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={toggleFlip}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      aria-label={`Flashcard for ${card.name}`}
    >
      {showActions && (
        <div className="flashcard-actions" aria-hidden={isFlipped}>
          <button
            type="button"
            className="tiny-btn"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="tiny-btn danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
      <div className="flashcard-inner">
        <div className="flashcard-face flashcard-front" style={frontStyle}>
          {card.imageUrl && <img src={card.imageUrl} alt={card.name} loading="lazy" />}
        </div>
        <div className="flashcard-face flashcard-back">
          <p>{card.name}</p>
          {card.audioUrl && (
            <div className="audio-controls">
              <button
                type="button"
                className="tiny-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setMuted((current) => !current);
                }}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                className="tiny-btn"
                onClick={handleManualPlay}
                aria-label={`Play audio for ${card.name}`}
              >
                Play
              </button>
              {playError && <span className="audio-hint">{playError}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
