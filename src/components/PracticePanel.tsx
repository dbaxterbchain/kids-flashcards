import { Box, Button, Chip, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FlashcardData } from '../flashcards/types';
import { Flashcard } from './Flashcard';
import './PracticePanel.css';

type PracticePanelProps = {
  enabled: boolean;
  hasDue: boolean;
  dueCount: number;
  totalCount: number;
  nextDueLabel?: string | null;
  card: FlashcardData | null;
  isFlipped: boolean;
  promptSide: 'image' | 'word';
  promptMode: 'image' | 'word' | 'alternate';
  onPromptModeChange: (mode: 'image' | 'word' | 'alternate') => void;
  options: FlashcardData[];
  selectedOptionId?: string | null;
  locked: boolean;
  feedback: 'correct' | 'incorrect' | null;
  canStart: boolean;
  selectedSetLabel?: string | null;
  progressValue?: number | null;
  onStart: () => void;
  onExit: () => void;
  onSelectOption: (id: string) => void;
  progressLabel?: string | null;
  error?: string | null;
};

export function PracticePanel({
  enabled,
  hasDue,
  dueCount,
  totalCount,
  nextDueLabel,
  card,
  isFlipped,
  promptSide,
  promptMode,
  onPromptModeChange,
  options,
  selectedOptionId,
  locked,
  feedback,
  canStart,
  selectedSetLabel,
  progressValue,
  onStart,
  onExit,
  onSelectOption,
  progressLabel,
  error,
}: PracticePanelProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        mb: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Practice mode
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? '' : 's'} due now` : 'No cards due right now.'}
              {nextDueLabel ? ` Next up in ${nextDueLabel}.` : ''}
            </Typography>
            {selectedSetLabel && (
              <Typography variant="caption" color="text.secondary">
                Practice sets: {selectedSetLabel}
              </Typography>
            )}
          </Stack>
          {enabled ? (
            <Button variant="outlined" onClick={onExit}>
              Exit practice
            </Button>
          ) : (
            <Button variant="contained" onClick={onStart} disabled={!canStart}>
              Start practice
            </Button>
          )}
        </Stack>

        {enabled ? (
          <>
            {!hasDue && totalCount > 0 && (
              <Chip label="No cards due — showing upcoming cards" color="info" variant="outlined" />
            )}
            {progressValue != null && (
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{ height: 8, borderRadius: 999, bgcolor: 'action.hover' }}
              />
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {promptSide === 'image' ? 'Pick the matching word.' : 'Pick the matching picture.'}
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={promptMode}
                onChange={(_, value) => value && onPromptModeChange(value)}
                aria-label="Practice prompt mode"
                disabled={locked}
              >
                <ToggleButton value="image" aria-label="Image prompt">
                  Image
                </ToggleButton>
                <ToggleButton value="word" aria-label="Word prompt">
                  Word
                </ToggleButton>
                <ToggleButton value="alternate" aria-label="Alternate prompt">
                  Alternate
                </ToggleButton>
              </ToggleButtonGroup>
              {progressLabel && (
                <Typography variant="caption" color="text.secondary">
                  {progressLabel}
                </Typography>
              )}
            </Stack>

            {card ? (
              <>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 360, position: 'relative' }}>
                  <Flashcard
                    card={card}
                    showActions={false}
                    onEdit={() => undefined}
                    onDelete={() => undefined}
                    isFlipped={isFlipped}
                    disableFlip
                  />
                  {feedback && (
                    <div className={`practice-feedback ${feedback === 'correct' ? 'success' : 'fail'}`}>
                      {feedback === 'correct' ? 'Correct!' : 'Not quite'}
                    </div>
                  )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  {options.map((option) => {
                    const isCorrect = option.id === card.id;
                    const isSelected = selectedOptionId === option.id;
                    const showCorrect = feedback && isCorrect;
                    const showIncorrect = feedback && isSelected && !isCorrect;
                    return (
                      <Button
                        key={option.id}
                        variant={showCorrect ? 'contained' : 'outlined'}
                        color={showCorrect ? 'success' : showIncorrect ? 'error' : 'primary'}
                        onClick={() => onSelectOption(option.id)}
                        disabled={locked}
                        sx={{
                          width: '100%',
                          minWidth: 0,
                          px: 2,
                          py: 1,
                          fontSize: '1rem',
                          borderColor: showIncorrect ? 'error.main' : undefined,
                        }}
                        aria-label={
                          promptSide === 'image'
                            ? `Option ${option.name}`
                            : `Option image for ${option.name}`
                        }
                      >
                        {promptSide === 'image' ? (
                          option.name
                        ) : (
                          <Box
                            sx={{
                              width: 96,
                              height: 72,
                              borderRadius: 1,
                              overflow: 'hidden',
                              bgcolor: option.backgroundColor || 'background.default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {option.imageUrl ? (
                              <img
                                src={option.imageUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : null}
                          </Box>
                        )}
                      </Button>
                    );
                  })}
                </Box>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Tap an option. We will flip the card, show feedback, then move on.
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No cards to practice yet. Create a card or select a set.
              </Typography>
            )}
            {error && (
              <Typography variant="body2" color="error" textAlign="center">
                {error}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Practice the cards from the sets you have visible with a quick multiple-choice check.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
