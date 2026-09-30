import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Button, ButtonBase, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { playSound, speakCard, stopSpeaking } from '../audio/sound';
import { GAME_INFO, GAME_ROUND, pickQuestions } from '../flashcards/games';
import { buildOptions, hashString } from '../flashcards/practice';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import { GameFrame, GameReward, GameSummary } from './GameParts';
import './Games.css';

type ListenGameProps = {
  title: string;
  cards: FlashcardData[];
  profile: ChildProfile | null;
  reward?: GameReward | null;
  onFinish: (result: { perfect: boolean }) => void;
  onPlayAgain: () => void;
  onExit: () => void;
};

/** Hear a word (never shown), then tap its picture: listening practice for kids who can't read yet. */
export function ListenGame({ title, cards, profile, reward, onFinish, onPlayAgain, onExit }: ListenGameProps) {
  const settings = profile?.settings ?? null;
  const choiceCount = settings?.choiceCount ?? 3;
  const soundEffects = settings?.soundEffects ?? true;
  const [seed] = useState(() => Date.now());
  const [questions] = useState(() => pickQuestions(cards, GAME_ROUND, seed));
  const [index, setIndex] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTries, setFirstTries] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const card = done ? null : questions[index] ?? null;
  const options = useMemo(
    () => (card ? buildOptions(card, cards, choiceCount, seed + hashString(card.id)) : []),
    [card, cards, choiceCount, seed],
  );

  // Say each word as its question appears. (This game always speaks; listening is the point.)
  useEffect(() => {
    if (card) speakCard(card);
  }, [card]);

  // Say it again once it's found, after the chime (cancelled if they move on first).
  useEffect(() => {
    if (!solved || !card) return undefined;
    const timeout = window.setTimeout(() => speakCard(card), soundEffects ? 400 : 0);
    return () => window.clearTimeout(timeout);
  }, [solved, card, soundEffects]);

  useEffect(() => () => stopSpeaking(), []);

  const pick = (option: FlashcardData) => {
    if (!card || solved || wrongIds.includes(option.id)) return;
    const correct = option.id === card.id;
    if (wrongIds.length === 0) setFirstTries((current) => [...current, correct]);
    if (correct) {
      setSolved(true);
    } else {
      setWrongIds((current) => [...current, option.id]);
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
        headline="Great listening"
        detail={`⭐ ${right} of ${questions.length} right on the first try`}
        reward={reward}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <GameFrame label={`${GAME_INFO.listen.name}: ${title}`} emoji={GAME_INFO.listen.emoji} title={GAME_INFO.listen.name} profile={profile} onExit={onExit}>
      <div className="practice-dots" role="img" aria-label={`Question ${index + 1} of ${questions.length}`}>
        {questions.map((question, questionIndex) => (
          <span
            key={question.id}
            className={`practice-dot practice-dot--${
              questionIndex < index || (questionIndex === index && solved)
                ? firstTries[questionIndex]
                  ? 'star'
                  : 'done'
                : questionIndex === index
                  ? 'current'
                  : 'todo'
            }`}
          >
            {(questionIndex < index || (questionIndex === index && solved)) && firstTries[questionIndex] ? '★' : ''}
          </span>
        ))}
      </div>
      {card && (
        <Stack spacing={1.5} alignItems="center">
          <ButtonBase className="listen-speaker" focusRipple onClick={() => speakCard(card)} aria-label="Hear it again">
            <VolumeUpIcon />
          </ButtonBase>
          <div className="practice-status" role="status">
            {solved ? (
              <>
                <span className="practice-status__text practice-status__text--correct">Yes! {card.name}!</span>
                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={next} sx={{ minWidth: 150, fontSize: '1.15rem' }}>
                  {index + 1 >= questions.length ? 'Finish' : 'Next'}
                </Button>
              </>
            ) : (
              <Typography className="practice-status__text" color={wrongIds.length > 0 ? '#c2410c' : 'text.secondary'}>
                {wrongIds.length > 0 ? 'Not quite. Listen again!' : 'Listen, then tap the picture.'}
              </Typography>
            )}
          </div>
          <div className={`practice-options practice-options--${options.length}`}>
            {options.map((option) => {
              const isWrong = wrongIds.includes(option.id);
              const isAnswer = solved && option.id === card.id;
              const state = isAnswer ? 'correct' : isWrong ? 'wrong' : solved ? 'dimmed' : 'idle';
              return (
                <ButtonBase
                  key={option.id}
                  focusRipple
                  className={`practice-tile practice-tile--${state}`}
                  onClick={() => pick(option)}
                  aria-label={option.name}
                  aria-disabled={solved || isWrong}
                  tabIndex={solved || isWrong ? -1 : 0}
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
            })}
          </div>
        </Stack>
      )}
    </GameFrame>
  );
}
