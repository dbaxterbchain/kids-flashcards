import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { Box, Button, Collapse, IconButton, Link, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorage';

const introSteps: { icon: ReactNode; text: string }[] = [
  { icon: <TouchAppIcon />, text: 'Tap a card to flip it over and see the word on the back.' },
  {
    icon: <AddPhotoAlternateIcon />,
    text: 'Tap New card to add your own photos (family, pets, favorite things) and record your voice saying the word.',
  },
  {
    icon: <EmojiEventsIcon />,
    text: 'Add each child under Practice for a matching game set up for their age. Each child keeps their own progress.',
  },
  { icon: <LockOutlinedIcon />, text: 'Your cards stay on this device and work offline. Nothing is uploaded.' },
];

export function AppHeader() {
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
          src="/icons/icon-192.png"
          alt=""
          sx={{ width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, borderRadius: 2, flexShrink: 0, boxShadow: 2 }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.85rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            Kids Flashcards
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
