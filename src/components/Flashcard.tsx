import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Card, IconButton, Stack, styled } from '@mui/material';
import { KeyboardEvent, useState } from 'react';
import { speakCard } from '../audio/sound';
import { FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import './Flashcard.css';

type FlashcardProps = {
  card: FlashcardData;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isFlipped?: boolean;
  disableFlip?: boolean;
  onFlipChange?: (value: boolean) => void;
  /** Say the word (the card's recording, or the device's voice) when the card is flipped over. */
  speakOnFlip?: boolean;
  className?: string;
};

export function Flashcard({
  card,
  showActions = false,
  onEdit,
  onDelete,
  isFlipped: isFlippedProp,
  disableFlip = false,
  onFlipChange,
  speakOnFlip = false,
  className,
}: FlashcardProps) {
  const [isFlippedState, setIsFlippedState] = useState(false);
  const isFlipped = isFlippedProp ?? isFlippedState;

  const setFlipped = (value: boolean) => {
    if (isFlippedProp === undefined) {
      setIsFlippedState(value);
    }
    onFlipChange?.(value);
  };

  const toggleFlip = () => {
    if (disableFlip) return;
    setFlipped(!isFlipped);
    // Speak from the tap itself; browsers (iOS especially) block sound that starts later.
    if (!isFlipped && speakOnFlip) speakCard(card);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <StyledCard
      className={['flashcard', isFlipped ? 'flipped' : '', className ?? ''].filter(Boolean).join(' ')}
      onClick={toggleFlip}
      onKeyDown={handleKey}
      tabIndex={disableFlip ? -1 : 0}
      role={disableFlip ? undefined : 'button'}
      aria-pressed={disableFlip ? undefined : isFlipped}
      aria-label={`Flashcard for ${card.name}`}
      elevation={3}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face flashcard-front">
          <CardFront card={card} />
        </div>
        <div className="flashcard-face flashcard-back">
          <p className="flashcard-name">{card.name}</p>
          {!disableFlip && (
            <IconButton
              className="flashcard-speak"
              tabIndex={isFlipped ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                speakCard(card);
              }}
              aria-label={`Hear ${card.name}`}
            >
              <VolumeUpIcon />
            </IconButton>
          )}
        </div>
      </div>

      {showActions && (
        <Stack
          direction="row"
          spacing={0.5}
          className="flashcard-actions"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            aria-label={`Edit ${card.name}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
            aria-label={`Delete ${card.name}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </StyledCard>
  );
}

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: 300,
  background: 'transparent',
  boxShadow: 'none',
  overflow: 'visible',
  perspective: 1200,
  '.flashcard-inner': {
    height: '100%',
    borderRadius: 18,
    boxShadow: theme.shadows[4],
    background: 'transparent',
  },
  // A light backing keeps the buttons visible on dark or busy card fronts.
  '.flashcard-actions .MuiIconButton-root, .flashcard-speak.MuiIconButton-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: theme.shadows[1],
    '&:hover': {
      backgroundColor: '#ffffff',
    },
  },
}));
