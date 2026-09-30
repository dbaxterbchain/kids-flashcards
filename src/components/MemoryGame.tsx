import { ButtonBase, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { playSound, speakCard, stopSpeaking } from '../audio/sound';
import { buildMemoryDeck, GAME_INFO, memoryMatchesWords, memoryPairCount, MemoryTile } from '../flashcards/games';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { CardFront } from './CardFront';
import { GameFrame, GameReward, GameSummary } from './GameParts';
import './Games.css';

type MemoryGameProps = {
  title: string;
  cards: FlashcardData[];
  profile: ChildProfile | null;
  reward?: GameReward | null;
  onFinish: (result: { perfect: boolean }) => void;
  onPlayAgain: () => void;
  onExit: () => void;
};

// How long two cards that don't match stay face up.
const MISMATCH_MS = 1100;

/** Flip two cards at a time to find the pairs. */
export function MemoryGame({ title, cards, profile, reward, onFinish, onPlayAgain, onExit }: MemoryGameProps) {
  const settings = profile?.settings ?? null;
  const readAloud = settings?.readAloud ?? true;
  const soundEffects = settings?.soundEffects ?? true;
  const withWords = memoryMatchesWords(settings);
  // The deck is dealt once per game.
  const [deck] = useState(() => buildMemoryDeck(cards, memoryPairCount(settings), withWords, Date.now()));
  const pairs = deck.length / 2;
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const timeouts = useRef<number[]>([]);

  useEffect(
    () => () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
      stopSpeaking();
    },
    [],
  );

  const later = (action: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(action, ms));
  };

  const cardFor = (tile: MemoryTile) => cards.find((card) => card.id === tile.cardId);

  const flip = (tile: MemoryTile) => {
    if (open.length === 2 || open.includes(tile.key) || matched.includes(tile.cardId)) return;
    const card = cardFor(tile);
    if (card && readAloud) speakCard(card);
    const nowOpen = [...open, tile.key];
    setOpen(nowOpen);
    if (nowOpen.length < 2) return;

    setTries((count) => count + 1);
    const [first, second] = nowOpen.map((key) => deck.find((candidate) => candidate.key === key));
    if (first && second && first.cardId === second.cardId) {
      const nowMatched = [...matched, first.cardId];
      setMatched(nowMatched);
      setOpen([]);
      if (soundEffects) playSound('correct');
      if (nowMatched.length === pairs) {
        later(() => {
          setDone(true);
          if (soundEffects) playSound('finish');
          onFinish({ perfect: tries + 1 === pairs });
        }, 900);
      }
    } else {
      later(() => setOpen([]), MISMATCH_MS);
    }
  };

  if (done) {
    return (
      <GameSummary
        profile={profile}
        headline="You found them all"
        detail={`${pairs} pairs in ${tries} tries`}
        reward={reward}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <GameFrame label={`${GAME_INFO.memory.name}: ${title}`} emoji={GAME_INFO.memory.emoji} title={GAME_INFO.memory.name} profile={profile} onExit={onExit}>
      <Typography textAlign="center" color="text.secondary" fontWeight={700}>
        {withWords ? 'Match each picture to its word.' : 'Find the matching pictures.'} {matched.length} of {pairs} found
      </Typography>
      <div className={`memory-grid memory-grid--${deck.length}`}>
        {deck.map((tile, index) => {
          const card = cardFor(tile);
          const isMatched = matched.includes(tile.cardId);
          const isOpen = isMatched || open.includes(tile.key);
          if (!card) return null;
          return (
            <ButtonBase
              key={tile.key}
              focusRipple
              className={`memory-tile${isOpen ? ' is-open' : ''}${isMatched ? ' is-matched' : ''}`}
              onClick={() => flip(tile)}
              aria-label={isOpen ? (tile.face === 'word' ? `Word: ${card.name}` : `Picture: ${card.name}`) : `Card ${index + 1}`}
              aria-disabled={isMatched}
            >
              <span className="memory-tile__inner">
                <span className="memory-tile__face memory-tile__back" aria-hidden>
                  ?
                </span>
                <span className="memory-tile__face memory-tile__front" aria-hidden>
                  {tile.face === 'picture' ? <CardFront card={card} alt="" /> : <span className="memory-tile__word">{card.name}</span>}
                </span>
              </span>
            </ButtonBase>
          );
        })}
      </div>
    </GameFrame>
  );
}
