import { Box } from '@mui/material';
import { FlashcardData } from '../flashcards/types';
import { Flashcard } from './Flashcard';

type FlashcardGridProps = {
  cards: FlashcardData[];
  showActions?: boolean;
  speakOnFlip?: boolean;
  onEdit?: (card: FlashcardData) => void;
  onDelete?: (card: FlashcardData) => void;
};

export function FlashcardGrid({ cards, showActions = false, speakOnFlip = false, onEdit, onDelete }: FlashcardGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.5, sm: 2.5 },
        // Two columns on phones so kids see more than one card at a time.
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fill, minmax(220px, 1fr))' },
      }}
    >
      {cards.map((card) => (
        <Flashcard
          key={card.id}
          card={card}
          className="flashcard--tile"
          showActions={showActions}
          speakOnFlip={speakOnFlip}
          onEdit={onEdit && (() => onEdit(card))}
          onDelete={onDelete && (() => onDelete(card))}
        />
      ))}
    </Box>
  );
}
