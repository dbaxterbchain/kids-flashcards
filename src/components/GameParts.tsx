import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import { Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { ChildProfile, Sticker } from '../flashcards/types';
import { ChildAvatar } from './ChildAvatar';
import { Confetti } from './Confetti';
import { StickerBadge } from './StickerBook';
import './PracticeSession.css';

export type GameReward = { sticker: Sticker; streak: number };

type GameFrameProps = {
  /** e.g. "Memory match: Farm animals" */
  label: string;
  emoji: string;
  title: string;
  profile: ChildProfile | null;
  onExit: () => void;
  children: ReactNode;
};

/** The card a game is played in, with who's playing and a way out. */
export function GameFrame({ label, emoji, title, profile, onExit, children }: GameFrameProps) {
  return (
    <Box component="section" aria-label={label} className="practice">
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {profile ? (
          <ChildAvatar profile={profile} size={40} />
        ) : (
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#e0e7ff', fontSize: 22 }}>{emoji}</Avatar>
        )}
        <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0, fontWeight: 800 }}>
          {title}
        </Typography>
        <IconButton aria-label="Stop playing" onClick={onExit}>
          <CloseIcon />
        </IconButton>
      </Stack>
      {children}
    </Box>
  );
}

type GameSummaryProps = {
  profile: ChildProfile | null;
  headline: string;
  detail: string;
  reward?: GameReward | null;
  onPlayAgain: () => void;
  onExit: () => void;
};

/** The celebration at the end of a game. */
export function GameSummary({ profile, headline, detail, reward, onPlayAgain, onExit }: GameSummaryProps) {
  return (
    <Box component="section" aria-label="Game results" className="practice practice--summary">
      <Confetti />
      <Stack spacing={2} alignItems="center" textAlign="center" role="status" sx={{ position: 'relative', zIndex: 1 }}>
        {profile && <ChildAvatar profile={profile} size={96} />}
        <Typography variant="h4" component="h2">
          {headline}
          {profile ? `, ${profile.name}!` : '!'}
        </Typography>
        {reward && (
          <Stack spacing={1} alignItems="center">
            <span className="sticker-reward">
              <StickerBadge sticker={reward.sticker} size={96} />
            </span>
            <Typography sx={{ fontWeight: 800 }}>
              {reward.sticker.shiny ? 'A shiny sticker for a perfect game!' : 'You earned a sticker!'}
            </Typography>
          </Stack>
        )}
        <Typography variant="h6" component="p" color="text.secondary">
          {detail}
        </Typography>
        {reward && reward.streak >= 2 && (
          <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
            🌟 {reward.streak} days in a row!
          </Typography>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
          <Button variant="contained" size="large" startIcon={<ReplayIcon />} onClick={onPlayAgain}>
            Play again
          </Button>
          <Button variant="outlined" size="large" onClick={onExit}>
            Done
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
