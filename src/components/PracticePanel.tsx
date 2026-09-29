import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Button, Chip, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FlashcardData } from '../flashcards/types';
import { Flashcard } from './Flashcard';
import './PracticePanel.css';

export type PracticeSummary = {
  correct: number;
  total: number;
  missed: FlashcardData[];
};

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
  onRestart: () => void;
  onSelectOption: (id: string) => void;
  progressLabel?: string | null;
  summary: PracticeSummary | null;
  error?: string | null;
};

const summaryMessage = (correct: number, total: number) => {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio === 1) return { emoji: '🌟', headline: 'Perfect score!' };
  if (ratio >= 0.7) return { emoji: '🎉', headline: 'Great job!' };
  if (ratio >= 0.4) return { emoji: '👏', headline: 'Nice work!' };
  return { emoji: '💪', headline: 'Good practice!' };
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
  onRestart,
  onSelectOption,
  progressLabel,
  summary,
  error,
}: PracticePanelProps) {
  const idleStatus =
    dueCount > 0
      ? `${dueCount} card${dueCount === 1 ? '' : 's'} ready to practice`
      : totalCount > 0
        ? `All caught up!${nextDueLabel ? ` Next review in ${nextDueLabel}.` : ''}`
        : 'Add cards to a set to start practicing.';
  const status = enabled && summary ? 'Round complete' : enabled && progressLabel ? `Card ${progressLabel}` : idleStatus;
  const result = summary ? summaryMessage(summary.correct, summary.total) : null;

  return (
    <Box
      component="section"
      aria-label="Practice"
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
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" component="h2" fontWeight={700}>
              Practice
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {status}
            </Typography>
            {selectedSetLabel && (
              <Typography variant="caption" color="text.secondary" component="p" noWrap>
                Sets: {selectedSetLabel}
              </Typography>
            )}
          </Box>
          {enabled ? (
            <Button variant="outlined" onClick={onExit} sx={{ flexShrink: 0 }}>
              Exit
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={onStart}
              disabled={!canStart}
              sx={{ flexShrink: 0 }}
            >
              Start
            </Button>
          )}
        </Stack>

        {enabled && summary && result && (
          <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ py: 2 }} role="status">
            <Typography component="p" sx={{ fontSize: '3.5rem', lineHeight: 1 }} aria-hidden>
              {result.emoji}
            </Typography>
            <Typography variant="h4" component="p">
              {result.headline}
            </Typography>
            <Typography variant="h6" component="p" color="text.secondary">
              You got {summary.correct} of {summary.total} right.
            </Typography>
            {summary.missed.length > 0 && (
              <Stack spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Keep practicing:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                  {summary.missed.map((missed) => (
                    <Chip key={missed.id} label={missed.name} variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            )}
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="contained" size="large" startIcon={<ReplayIcon />} onClick={onRestart}>
                Practice again
              </Button>
              <Button variant="outlined" size="large" onClick={onExit}>
                Done
              </Button>
            </Stack>
          </Stack>
        )}

        {enabled && !summary && (
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
                      <div className={`practice-feedback ${feedback === 'correct' ? 'success' : 'fail'}`} role="status">
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
                    const showCorrect = Boolean(feedback) && isCorrect;
                    const showIncorrect = Boolean(feedback) && isSelected && !isCorrect;
                    const dimmed = Boolean(feedback) && !showCorrect && !showIncorrect;
                    return (
                      <Button
                        key={option.id}
                        variant={showCorrect || showIncorrect ? 'contained' : 'outlined'}
                        color={showCorrect ? 'success' : showIncorrect ? 'error' : 'primary'}
                        startIcon={showCorrect ? <CheckIcon /> : showIncorrect ? <CloseIcon /> : undefined}
                        onClick={() => onSelectOption(option.id)}
                        // Not `disabled`: MUI greys out disabled buttons, which would hide the right/wrong colors.
                        aria-disabled={locked}
                        sx={{
                          width: '100%',
                          minWidth: 0,
                          px: 2,
                          py: 1,
                          fontSize: '1rem',
                          opacity: dimmed ? 0.45 : 1,
                          pointerEvents: locked ? 'none' : undefined,
                          transition: 'opacity 0.2s ease',
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
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : null}
                          </Box>
                        )}
                      </Button>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No cards to practice yet. Create a card or select a set.
              </Typography>
            )}
          </>
        )}

        {enabled && error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
