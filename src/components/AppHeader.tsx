import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { Box, Button, Collapse, IconButton, Link, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorage';

const introSteps: { icon: ReactNode; text: string }[] = [
  { icon: <TouchAppIcon />, text: 'Tap a set, then tap a card to flip it over and hear the word.' },
  {
    icon: <AddPhotoAlternateIcon />,
    text: 'Grown-ups: tap the lock to add ready-made sets from the library, or make cards with your own photos (family, pets, favorite things) and your voice.',
  },
  {
    icon: <EmojiEventsIcon />,
    text: 'Add each child under Practice for a matching game set up for their age. Each child keeps their own progress.',
  },
  { icon: <CloudOffIcon />, text: 'Your cards stay on this device and work offline. Nothing is uploaded.' },
];

type AppHeaderProps = {
  onOpenGrownUps: () => void;
};

export function AppHeader({ onOpenGrownUps }: AppHeaderProps) {
  const [introDismissed, setIntroDismissed] = useLocalStorageState('kids-flashcards:intro-dismissed', false);
  const introOpen = !introDismissed;

  return (
    <Box component="header" sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          background: 'linear-gradient(140deg, rgba(125, 224, 213, 0.35), rgba(255, 126, 182, 0.25))',
          border: '1px solid rgba(15, 23, 42, 0.05)',
        }}
      >
        <Box
          component="img"
          src="/logo.svg"
          alt=""
          sx={{
            width: { xs: 40, sm: 56 },
            height: { xs: 40, sm: 56 },
            flexShrink: 0,
            filter: 'drop-shadow(0 4px 8px rgba(37, 99, 235, 0.25))',
          }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '1.45rem', sm: '1.85rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            <Box component="span" sx={{ color: 'primary.main' }}>
              Kids
            </Box>{' '}
            Flashcards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Brought to you free by{' '}
            <Link href="https://bchain.coffee" target="_blank" rel="noreferrer" underline="hover" fontWeight={700}>
              Beanchain Coffee
            </Link>
          </Typography>
        </Box>
        <IconButton
          aria-label={introOpen ? 'Hide how it works' : 'How it works'}
          aria-expanded={introOpen}
          aria-controls="app-intro"
          onClick={() => setIntroDismissed((dismissed) => !dismissed)}
          sx={{
            flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(15,23,42,0.08)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        >
          <HelpOutlineIcon />
        </IconButton>
        <Button
          variant="outlined"
          onClick={onOpenGrownUps}
          aria-label="Grown-ups"
          startIcon={<LockOutlinedIcon />}
          sx={{
            flexShrink: 0,
            minWidth: { xs: 44, sm: 64 },
            px: { xs: 1.25, sm: 2 },
            bgcolor: 'rgba(255,255,255,0.6)',
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: { xs: 0, sm: -0.5 } },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Grown-ups
          </Box>
        </Button>
      </Box>

      <Collapse in={introOpen}>
        <Box
          id="app-intro"
          sx={{
            mt: 1.5,
            p: 2,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" component="h2" fontWeight={800} sx={{ mb: 1 }}>
            Welcome! Here&apos;s how it works
          </Typography>
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {introSteps.map((step) => (
              <Stack component="li" key={step.text} direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }} aria-hidden>
                  {step.icon}
                </Box>
                <Typography variant="body1">{step.text}</Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
            <Button variant="contained" onClick={() => setIntroDismissed(true)}>
              Got it
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
