import { Box, FormControlLabel, Stack, Switch, Typography } from '@mui/material';

type KidLockSectionProps = {
  kidLock: boolean;
  onKidLockChange: (value: boolean) => void;
};

const isApple = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const DEVICE_LOCKS = [
  {
    id: 'apple',
    title: 'iPhone and iPad: Guided Access',
    steps:
      'Turn it on in Settings › Accessibility › Guided Access. Open Kids Flashcards, then press the side button (or Home button) three times and tap Start. To finish, press it three times again and enter your passcode.',
  },
  {
    id: 'android',
    title: 'Android: App pinning',
    steps:
      'Turn it on in Settings › Security (sometimes under More security settings) › App pinning. Open Kids Flashcards, open your recent apps, tap the app’s icon at the top and choose Pin. To unpin, touch and hold Back and Overview, or swipe up and hold.',
  },
];

/** The kid lock switch, and how to lock the whole device for even more peace of mind. */
export function KidLockSection({ kidLock, onKidLockChange }: KidLockSectionProps) {
  // Show this device's own lock first.
  const locks = isApple() ? DEVICE_LOCKS : [...DEVICE_LOCKS].reverse();

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={kidLock} onChange={(event) => onKidLockChange(event.target.checked)} />}
        label="Kid lock"
      />
      <Typography variant="body2" color="text.secondary">
        Keeps little fingers in the app: fills the screen, keeps swipes and the back button from leaving, asks
        before the page closes, hides links to other websites, and stops pinch zoom. Turn it off here when
        you&apos;re done.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        A website can&apos;t stop the home button or switching apps. For that, use your device&apos;s own lock
        (install Kids Flashcards on your home screen first, so it opens on its own):
      </Typography>
      <Stack component="ul" spacing={1} sx={{ pl: 2.5, mt: 1, mb: 0 }}>
        {locks.map((lock) => (
          <Typography component="li" variant="body2" color="text.secondary" key={lock.id}>
            <Box component="strong" sx={{ color: 'text.primary' }}>
              {lock.title}.
            </Box>{' '}
            {lock.steps}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
