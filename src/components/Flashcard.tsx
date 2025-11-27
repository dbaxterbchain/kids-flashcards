import { useState } from 'react';
import './Flashcard.css';

export type FlashcardData = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
};

type FlashcardProps = {
  card: FlashcardData;
};

export function Flashcard({ card }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={() => setIsFlipped((current) => !current)}
      aria-label={`Flashcard for ${card.name}`}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face flashcard-front">
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        </div>
        <div className="flashcard-face flashcard-back">
          <p>{card.name}</p>
        </div>
      </div>
    </button>
  );
}
