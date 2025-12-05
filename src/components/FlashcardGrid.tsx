import { Box } from '@mui/material';
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
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(240px, 1fr))', sm: 'repeat(auto-fill, minmax(260px, 1fr))' },
      }}
    >
      {cards.map((card) => (
        <Flashcard
          key={card.id}
          card={card}
          showActions={showActions}
          onEdit={() => onEdit(card)}
          onDelete={() => onDelete(card.id)}
        />
      ))}
    </Box>
  );
}
