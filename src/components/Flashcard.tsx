import { KeyboardEvent, useState } from 'react';
import './Flashcard.css';

export type FlashcardData = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
};

type FlashcardProps = {
  card: FlashcardData;
  showActions?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function Flashcard({ card, showActions = true, onEdit, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => setIsFlipped((current) => !current);
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
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
        <div className="flashcard-face flashcard-front">
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        </div>
        <div className="flashcard-face flashcard-back">
          <p>{card.name}</p>
        </div>
      </div>
    </div>
  );
}
