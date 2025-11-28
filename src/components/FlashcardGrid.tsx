import { FlashcardData } from '../flashcards/types';
import { Flashcard } from './Flashcard';

type FlashcardGridProps = {
  cards: FlashcardData[];
  showActions: boolean;
  onEdit: (card: FlashcardData) => void;
  onDelete: (id: string) => void;
};

export function FlashcardGrid({ cards, showActions, onEdit, onDelete }: FlashcardGridProps) {
  return (
    <div className="grid">
      {cards.map((card) => (
        <Flashcard
          key={card.id}
          card={card}
          showActions={showActions}
          onEdit={() => onEdit(card)}
          onDelete={() => onDelete(card.id)}
        />
      ))}
    </div>
  );
}
