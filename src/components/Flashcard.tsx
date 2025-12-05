import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MicOffIcon from '@mui/icons-material/MicOff';
import MicOutlinedIcon from '@mui/icons-material/MicOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Card, IconButton, Stack, Typography, styled } from '@mui/material';
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
    <StyledCard
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={toggleFlip}
      onKeyDown={handleKey}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      aria-label={`Flashcard for ${card.name}`}
      elevation={3}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face flashcard-front" style={frontStyle}>
          {card.imageUrl && <img src={card.imageUrl} alt={card.name} loading="lazy" />}
        </div>
        <div className="flashcard-face flashcard-back">
          <Typography variant="h5" component="p" sx={{ mb: 1, textAlign: 'center' }}>
            {card.name}
          </Typography>
          {card.audioUrl && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="center"
              className="audio-controls"
            >
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setMuted((current) => !current);
                }}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              >
                {muted ? <MicOffIcon fontSize="small" /> : <MicOutlinedIcon fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={handleManualPlay} aria-label={`Play audio for ${card.name}`}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
              {playError && (
                <Typography variant="caption" color="text.secondary" className="audio-hint">
                  {playError}
                </Typography>
              )}
            </Stack>
          )}
        </div>
      </div>

      {showActions && (
        <Stack
          direction="row"
          spacing={0.5}
          className="flashcard-actions"
          aria-hidden={isFlipped}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label="Edit card"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label="Delete card"
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
}));
