import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { ChildProfile, Sticker } from '../flashcards/types';
import { ChildAvatar } from './ChildAvatar';
import './StickerBook.css';

type StickerBookProps = {
  profile: ChildProfile;
  streak: number;
  onBack: () => void;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** A sticker as it's shown on the page: a round, white-edged sticker, gold-edged when shiny. */
export function StickerBadge({ sticker, size = 72, tilt = 0 }: { sticker: Sticker; size?: number; tilt?: number }) {
  return (
    <span
      className={`sticker${sticker.shiny ? ' sticker--shiny' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.58), transform: `rotate(${tilt}deg)` }}
      role="img"
      aria-label={sticker.shiny ? `Shiny ${sticker.emoji} sticker` : `${sticker.emoji} sticker`}
    >
      {sticker.emoji}
    </span>
  );
}

// Each sticker sits at its own slight angle, like it was stuck on by hand.
const tiltFor = (index: number) => ((index * 37) % 17) - 8;

/** A child's collection of stickers, newest first. */
export function StickerBook({ profile, streak, onBack }: StickerBookProps) {
  const stickers = [...(profile.stickers ?? [])].reverse();
  return (
    <Box component="section" aria-labelledby="stickers-heading">
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <IconButton
          onClick={onBack}
          aria-label="Back"
          size="large"
          sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <ChildAvatar profile={profile} size={44} />
        <Typography id="stickers-heading" variant="h5" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0, fontWeight: 800 }}>
          {profile.name}&apos;s stickers
        </Typography>
      </Stack>
      <Box className="sticker-book">
        <Stack direction="row" flexWrap="wrap" gap={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800 }}>{plural(stickers.length, 'sticker')}</Typography>
          {streak >= 2 && <Typography sx={{ fontWeight: 800 }}>🌟 {streak} days in a row!</Typography>}
        </Stack>
        {stickers.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
            Finish a practice round to earn your first sticker!
          </Typography>
        ) : (
          <div className="sticker-grid">
            {stickers.map((sticker, index) => (
              <StickerBadge key={`${sticker.at}-${index}`} sticker={sticker} tilt={tiltFor(index)} />
            ))}
          </div>
        )}
      </Box>
    </Box>
  );
}
