import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, ButtonBase, Chip, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { playSound, speakCard, stopSpeaking } from '../audio/sound';
import { buildOptions, hashString, promptSideFor } from '../flashcards/practice';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import { ChildAvatar } from './ChildAvatar';
import { Confetti } from './Confetti';
import { Flashcard } from './Flashcard';
import './PracticeSession.css';

type PracticeSessionProps = {
  profile: ChildProfile;
  /** The cards in this round, in the order they're asked. */
  cards: FlashcardData[];
  /** Cards the child hasn't met, introduced before the questions and then asked with two choices. */
  newCards?: FlashcardData[];
  /** Cards to draw the wrong answers from. */
  pool: FlashcardData[];
  seed: number;
  /** Called once per card with whether the first try was right. */
  onAnswer: (cardId: string, correct: boolean) => void;
  onRestart: () => void;
  onExit: () => void;
  error?: string | null;
};

const summaryHeadline = (correct: number, total: number) => {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio === 1) return 'Perfect score';
  if (ratio >= 0.7) return 'Great job';
  if (ratio >= 0.4) return 'Nice work';
  return 'Good practice';
};

export function PracticeSession({
  profile,
  cards,
  newCards = [],
  pool,
  seed,
  onAnswer,
  onRestart,
  onExit,
  error,
}: PracticeSessionProps) {
  const { settings } = profile;
  const [introIndex, setIntroIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [complete, setComplete] = useState(false);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  const introCard = complete ? null : newCards[introIndex] ?? null;
  const card = complete || introCard ? null : cards[index] ?? null;
  const side = promptSideFor(settings.promptMode, index);
  // A card that was just introduced is asked with only two choices.
  const isNewCard = card !== null && newCards.some((newCard) => newCard.id === card.id);
  const choiceCount = isNewCard ? Math.min(2, settings.choiceCount) : settings.choiceCount;
  const options = useMemo(
    () => (card ? buildOptions(card, pool, choiceCount, seed + hashString(card.id)) : []),
    [card, pool, choiceCount, seed],
  );

  // Say each new card as it's introduced.
  useEffect(() => {
    if (introCard && settings.readAloud) speakCard(introCard);
  }, [introCard, settings.readAloud]);

  // Say the word when a "find the picture" question appears.
  useEffect(() => {
    if (card && settings.readAloud && side === 'find-picture') speakCard(card);
  }, [card, side, settings.readAloud]);

  // Say it again once it's found, after the chime.
  useEffect(() => {
    if (!solved || !card || !settings.readAloud) return undefined;
    const timeout = window.setTimeout(() => speakCard(card), settings.soundEffects ? 400 : 0);
    return () => window.clearTimeout(timeout);
  }, [solved, card, settings.readAloud, settings.soundEffects]);

  useEffect(() => {
    if (solved) nextButtonRef.current?.focus();
  }, [solved]);

  useEffect(() => () => stopSpeaking(), []);

  const handlePick = (option: FlashcardData) => {
    if (!card || solved || wrongIds.includes(option.id)) return;
    const correct = option.id === card.id;
    if (wrongIds.length === 0) {
      setResults((current) => ({ ...current, [card.id]: correct }));
      onAnswer(card.id, correct);
    }
    if (correct) {
      setSolved(true);
    } else {
      // Keep going until they find it; the first try is what counts for progress.
      setWrongIds((current) => [...current, option.id]);
    }
    if (settings.soundEffects) playSound(correct ? 'correct' : 'wrong');
  };

  const goNext = () => {
    stopSpeaking();
    if (index + 1 >= cards.length) {
      setComplete(true);
      if (settings.soundEffects) playSound('finish');
      return;
    }
    setIndex(index + 1);
    setWrongIds([]);
    setSolved(false);
  };

  const nextIntro = () => {
    stopSpeaking();
    setIntroIndex(introIndex + 1);
  };

  const exit = () => {
    stopSpeaking();
    onExit();
  };

  const header = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <ChildAvatar profile={profile} size={40} />
      <Typography variant="h6" component="h2" noWrap sx={{ flexGrow: 1, minWidth: 0, fontWeight: 800 }}>
        {profile.name}
      </Typography>
      <IconButton aria-label="Stop practicing" onClick={exit}>
        <CloseIcon />
      </IconButton>
    </Stack>
  );

  if (complete) {
    const correctCount = cards.filter((roundCard) => results[roundCard.id]).length;
    const missed = cards.filter((roundCard) => results[roundCard.id] === false);
    return (
      <Box component="section" aria-label="Practice results" className="practice practice--summary">
        <Confetti />
        <Stack spacing={2} alignItems="center" textAlign="center" role="status" sx={{ position: 'relative', zIndex: 1 }}>
          <ChildAvatar profile={profile} size={96} />
          <Typography variant="h4" component="h2">
            {summaryHeadline(correctCount, cards.length)}, {profile.name}!
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary">
            ⭐ {correctCount} of {cards.length} right on the first try
          </Typography>
          {newCards.length > 0 && (
            <Stack spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                New today:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                {newCards.map((newCard) => (
                  <Chip key={newCard.id} icon={<AutoAwesomeIcon />} label={newCard.name} color="secondary" variant="outlined" />
                ))}
              </Stack>
            </Stack>
          )}
          {missed.length > 0 && (
            <Stack spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Let&apos;s practice these again soon:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
                {missed.map((missedCard) => (
                  <Chip key={missedCard.id} label={missedCard.name} variant="outlined" />
                ))}
              </Stack>
            </Stack>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button variant="contained" size="large" startIcon={<ReplayIcon />} onClick={onRestart}>
              Play again
            </Button>
            <Button variant="outlined" size="large" onClick={exit}>
              Done
            </Button>
          </Stack>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </Box>
    );
  }

  if (introCard) {
    const last = introIndex + 1 >= newCards.length;
    return (
      <Box component="section" aria-label={`New cards for ${profile.name}`} className="practice">
        {header}
        <Stack spacing={1.5} alignItems="center" className="practice-intro">
          <Chip
            icon={<AutoAwesomeIcon />}
            label={newCards.length > 1 ? `New card ${introIndex + 1} of ${newCards.length}` : 'New card'}
            color="secondary"
            sx={{ fontWeight: 800 }}
          />
          <ButtonBase
            key={introCard.id}
            focusRipple
            className="practice-intro__card"
            onClick={() => speakCard(introCard)}
            aria-label={`Hear ${introCard.name}`}
          >
            <CardFront card={introCard} alt="" />
          </ButtonBase>
          <p className="practice-intro__word">{introCard.name}</p>
          <Button variant="text" startIcon={<VolumeUpIcon />} onClick={() => speakCard(introCard)}>
            Hear it again
          </Button>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={nextIntro}
            sx={{ minWidth: 170, fontSize: '1.15rem' }}
          >
            {last ? "Let's play!" : 'Next'}
          </Button>
        </Stack>
        {error && (
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box component="section" aria-label={`Practice for ${profile.name}`} className="practice">
      {header}

      <Box className="practice-dots" role="img" aria-label={`Card ${index + 1} of ${cards.length}`}>
        {cards.map((roundCard, cardIndex) => {
          const answered = cardIndex < index || (cardIndex === index && solved);
          const state = answered
            ? results[roundCard.id]
              ? 'star'
              : 'done'
            : cardIndex === index
              ? 'current'
              : 'todo';
          return (
            <span key={roundCard.id} className={`practice-dot practice-dot--${state}`}>
              {state === 'star' ? '★' : ''}
            </span>
          );
        })}
      </Box>

      {card ? (
        <>
          <Stack spacing={1} alignItems="center">
            <Typography variant="subtitle1" component="p" color="text.secondary" fontWeight={700}>
              {side === 'find-picture' ? 'Find' : 'What is this?'}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 340 }}>
              <Flashcard
                key={`${index}-${card.id}`}
                card={card}
                className="flashcard--practice"
                isFlipped={side === 'find-picture' ? !solved : solved}
                disableFlip
              />
            </Box>
            {(side === 'find-picture' || solved) && (
              <Button variant="text" startIcon={<VolumeUpIcon />} onClick={() => speakCard(card)}>
                {side === 'find-picture' ? 'Hear it again' : 'Hear it'}
              </Button>
            )}
          </Stack>

          <div className="practice-status" role="status">
            {solved ? (
              <>
                <span className="practice-status__text practice-status__text--correct">Yes! That&apos;s {card.name}!</span>
                <Button
                  ref={nextButtonRef}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={goNext}
                  sx={{ minWidth: 150, fontSize: '1.15rem' }}
                >
                  {index + 1 >= cards.length ? 'Finish' : 'Next'}
                </Button>
              </>
            ) : wrongIds.length > 0 ? (
              <span className="practice-status__text practice-status__text--wrong">Not quite. Try again!</span>
            ) : null}
          </div>

          <div className={`practice-options practice-options--${options.length}`}>
            {options.map((option) => {
              const isWrong = wrongIds.includes(option.id);
              const isAnswer = solved && option.id === card.id;
              const state = isAnswer ? 'correct' : isWrong ? 'wrong' : solved ? 'dimmed' : 'idle';
              const locked = solved || isWrong;
              if (side === 'find-picture') {
                return (
                  <ButtonBase
                    key={option.id}
                    focusRipple
                    className={`practice-tile practice-tile--${state}`}
                    onClick={() => handlePick(option)}
                    aria-label={option.name}
                    aria-disabled={locked}
                    tabIndex={locked ? -1 : 0}
                  >
                    <CardFront card={option} alt="" />
                    {isAnswer && (
                      <span className="practice-badge practice-badge--correct">
                        <CheckIcon />
                      </span>
                    )}
                    {isWrong && (
                      <span className="practice-badge practice-badge--wrong">
                        <CloseIcon />
                      </span>
                    )}
                  </ButtonBase>
                );
              }
              return (
                <Button
                  key={option.id}
                  variant={isAnswer ? 'contained' : 'outlined'}
                  color={isAnswer ? 'success' : isWrong ? 'error' : 'primary'}
                  startIcon={isAnswer ? <CheckIcon /> : isWrong ? <CloseIcon /> : undefined}
                  onClick={() => handlePick(option)}
                  aria-disabled={locked}
                  tabIndex={locked ? -1 : 0}
                  className={`practice-word practice-tile--${state}`}
                >
                  {option.name}
                </Button>
              );
            })}
          </div>
        </>
      ) : (
        <Typography color="text.secondary" textAlign="center">
          There are no cards to practice.
        </Typography>
      )}

      {error && (
        <Typography variant="body2" color="error" textAlign="center">
          {error}
        </Typography>
      )}
    </Box>
  );
}
