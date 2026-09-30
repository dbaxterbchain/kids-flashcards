import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Button, ButtonBase, IconButton, Stack, Typography } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { playSound, speakCard, stopSpeaking } from '../audio/sound';
import { buildOddOneOut, GAME_INFO, GAME_ROUND, oddOneOutBelonging } from '../flashcards/games';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import { GameFrame, GameReward, GameSummary } from './GameParts';
import './Games.css';

type OddOneOutGameProps = {
  /** The set being played. */
  title: string;
  setCards: FlashcardData[];
  /** Cards from the other sets kids can see, where the odd ones come from. */
  otherCards: FlashcardData[];
  profile: ChildProfile | null;
  reward?: GameReward | null;
  onFinish: (result: { perfect: boolean }) => void;
  onPlayAgain: () => void;
  onExit: () => void;
};

const QUESTION = "Which one doesn't belong?";

/** A few pictures from the set and one from somewhere else: find the one that doesn't belong. */
export function OddOneOutGame({ title, setCards, otherCards, profile, reward, onFinish, onPlayAgain, onExit }: OddOneOutGameProps) {
  const settings = profile?.settings ?? null;
  const readAloud = settings?.readAloud ?? true;
  const soundEffects = settings?.soundEffects ?? true;
  const [questions] = useState(() =>
    buildOddOneOut(setCards, otherCards, {
      questions: GAME_ROUND,
      belonging: oddOneOutBelonging(settings),
      seed: Date.now(),
    }),
  );
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTries, setFirstTries] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const question = done ? null : questions[index] ?? null;
  const odd = question?.items.find((item) => item.id === question.oddId) ?? null;

  useEffect(() => {
    if (question && readAloud) speakCard({ name: QUESTION });
  }, [question, readAloud]);

  // Say the odd one's word once it's found, after the chime (cancelled if they move on first).
  useEffect(() => {
    if (!solved || !odd || !readAloud) return undefined;
    const timeout = window.setTimeout(() => speakCard(odd), soundEffects ? 400 : 0);
    return () => window.clearTimeout(timeout);
  }, [solved, odd, readAloud, soundEffects]);

  useEffect(() => () => stopSpeaking(), []);

  const pick = (item: FlashcardData) => {
    if (!question || !odd || solved || wrongIds.includes(item.id)) return;
    const correct = item.id === odd.id;
    if (wrongIds.length === 0) setFirstTries((current) => [...current, correct]);
    if (correct) {
      setSolved(true);
    } else {
      setWrongIds((current) => [...current, item.id]);
    }
    if (soundEffects) playSound(correct ? 'correct' : 'wrong');
  };

  const next = () => {
    stopSpeaking();
    if (index + 1 >= questions.length) {
      setDone(true);
      if (soundEffects) playSound('finish');
      onFinish({ perfect: firstTries.every(Boolean) });
      return;
    }
    setIndex(index + 1);
    setWrongIds([]);
    setSolved(false);
  };

  if (done) {
    const right = firstTries.filter(Boolean).length;
    return (
      <GameSummary
        profile={profile}
        headline="Great spotting"
        detail={`⭐ ${right} of ${questions.length} right on the first try`}
        reward={reward}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />
    );
  }

  const frame = (children: ReactNode) => (
    <GameFrame
      label={`${GAME_INFO['odd-one-out'].name}: ${title}`}
      emoji={GAME_INFO['odd-one-out'].emoji}
      title={GAME_INFO['odd-one-out'].name}
      profile={profile}
      onExit={onExit}
    >
      {children}
    </GameFrame>
  );

  if (!question || !odd) {
    return frame(
      <Typography textAlign="center" color="text.secondary" sx={{ py: 4 }}>
        This game needs at least 3 cards in this set, and cards in another set to mix in.
      </Typography>,
    );
  }

  return frame(
    <Stack spacing={1.5} alignItems="center">
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
          {QUESTION}
        </Typography>
        <IconButton aria-label="Hear the question" onClick={() => speakCard({ name: QUESTION })}>
          <VolumeUpIcon />
        </IconButton>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Question {index + 1} of {questions.length}
      </Typography>
      <div className={`practice-options practice-options--${question.items.length}`}>
        {question.items.map((item) => {
          const isWrong = wrongIds.includes(item.id);
          const isAnswer = solved && item.id === odd.id;
          const state = isAnswer ? 'correct' : isWrong ? 'wrong' : solved ? 'dimmed' : 'idle';
          return (
            <ButtonBase
              key={item.id}
              focusRipple
              className={`practice-tile practice-tile--${state}`}
              onClick={() => pick(item)}
              aria-label={item.name}
              aria-disabled={solved || isWrong}
              tabIndex={solved || isWrong ? -1 : 0}
            >
              <CardFront card={item} alt="" />
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
        })}
      </div>
      <div className="practice-status" role="status">
        {solved ? (
          <>
            <span className="practice-status__text practice-status__text--correct">
              Yes! {odd.name} doesn&apos;t belong with {title}.
            </span>
            <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={next} sx={{ minWidth: 150, fontSize: '1.15rem' }}>
              {index + 1 >= questions.length ? 'Finish' : 'Next'}
            </Button>
          </>
        ) : wrongIds.length > 0 ? (
          <span className="practice-status__text practice-status__text--wrong">That one belongs. Try again!</span>
        ) : null}
      </div>
    </Stack>,
  );
}
