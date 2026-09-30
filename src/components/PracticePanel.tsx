import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { PROMPT_MODE_LABELS } from '../flashcards/practice';
import { ChildProfile } from '../flashcards/types';
import { ChildAvatar } from './ChildAvatar';

type PracticePanelProps = {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  loading: boolean;
  /** Cards due now in the active child's sets. */
  readyCount: number;
  /** Cards in the active child's sets. */
  poolSize: number;
  canStart: boolean;
  nextReviewLabel: string | null;
  setLabel: string;
  onSelectProfile: (id: string) => void;
  onAddProfile: () => void;
  /** Opens the selected child's settings; the button is hidden when not given. */
  onEditProfile?: () => void;
  onStart: () => void;
  /** The active child's sticker count and days-in-a-row practice streak. */
  stickerCount?: number;
  streak?: number;
  onOpenStickers?: () => void;
  error?: string | null;
};

export function PracticePanel({
  profiles,
  activeProfile,
  loading,
  readyCount,
  poolSize,
  canStart,
  nextReviewLabel,
  setLabel,
  onSelectProfile,
  onAddProfile,
  onEditProfile,
  onStart,
  stickerCount = 0,
  streak = 0,
  onOpenStickers,
  error,
}: PracticePanelProps) {
  const name = activeProfile?.name ?? '';
  const status =
    poolSize < 2
      ? `Add at least 2 cards to ${name}'s sets to start.`
      : readyCount > 0
        ? `${readyCount} card${readyCount === 1 ? '' : 's'} ready for ${name}`
        : `${name} is all caught up!${nextReviewLabel ? ` More cards in ${nextReviewLabel}.` : ''}`;

  return (
    <Box
      component="section"
      aria-labelledby="practice-heading"
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        mb: 3,
      }}
    >
      <Stack spacing={1.5}>
        <Typography id="practice-heading" variant="subtitle1" component="h2" fontWeight={700}>
          Practice
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : profiles.length === 0 || !activeProfile ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              Add your child to play a matching game set up for their age. Each child keeps their own progress.
            </Typography>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={onAddProfile} sx={{ flexShrink: 0 }}>
              Add child
            </Button>
          </Stack>
        ) : (
          <>
            <Stack direction="row" flexWrap="wrap" gap={1} role="radiogroup" aria-label="Who's practicing?">
              {profiles.map((profile) => {
                const selected = profile.id === activeProfile.id;
                return (
                  <Chip
                    key={profile.id}
                    role="radio"
                    aria-checked={selected}
                    avatar={<ChildAvatar profile={profile} size={30} />}
                    label={profile.name}
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => onSelectProfile(profile.id)}
                    sx={{
                      height: 40,
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      '& .MuiChip-avatar': { width: 30, height: 30, fontSize: '1.1rem' },
                    }}
                  />
                );
              })}
              <Chip
                icon={<AddIcon />}
                label="Add child"
                variant="outlined"
                onClick={onAddProfile}
                sx={{ height: 40, borderRadius: 999, borderStyle: 'dashed' }}
              />
            </Stack>

            {(stickerCount > 0 || streak >= 2) && (
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                {stickerCount > 0 && onOpenStickers && (
                  <Chip
                    label={`🏅 ${stickerCount} sticker${stickerCount === 1 ? '' : 's'}`}
                    onClick={onOpenStickers}
                    aria-label={`${name}'s stickers: ${stickerCount}`}
                    sx={{ height: 36, borderRadius: 999, fontWeight: 700, bgcolor: '#fef3c7', '&:hover': { bgcolor: '#fde68a' } }}
                  />
                )}
                {streak >= 2 && (
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    🌟 {streak} days in a row!
                  </Typography>
                )}
              </Stack>
            )}

            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {status}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p" noWrap>
                  {PROMPT_MODE_LABELS[activeProfile.settings.promptMode]} · {activeProfile.settings.choiceCount} choices ·{' '}
                  {setLabel}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                {onEditProfile && (
                  <IconButton aria-label={`Practice settings for ${name}`} onClick={onEditProfile}>
                    <TuneIcon />
                  </IconButton>
                )}
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={onStart}
                  disabled={!canStart}
                >
                  Start
                </Button>
              </Stack>
            </Stack>
          </>
        )}

        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
