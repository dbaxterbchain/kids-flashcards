import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import { Box, Chip, Collapse, IconButton, Stack, Typography, styled } from '@mui/material';
import { keyframes } from '@mui/system';
import { useState } from 'react';

const float = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-14px) scale(1.03); }
`;

export function Hero() {
  const [open, setOpen] = useState(true);

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        background: 'linear-gradient(140deg, rgba(125, 224, 213, 0.35), rgba(255, 126, 182, 0.25))',
        border: '1px solid rgba(15, 23, 42, 0.05)',
        boxShadow: '0 18px 36px rgba(0, 0, 0, 0.05)',
        marginBottom: 3,
      }}
    >
      <Grid container spacing={1.5} alignItems={open ? 'center' : 'flex-start'}>
        <Grid size={{ xs: 11, md: open ? 7 : 11 }}>
          <Stack spacing={0.5} zIndex={1} sx={{ width: '100%'}}>
            <Chip
              label="Spark curiosity"
              sx={{
                justifySelf: 'flex-start',
                bgcolor: '#0f172a',
                color: '#f8fafc',
                fontWeight: 800,
                width: '230px',
                height: '36px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            />

            <Collapse in={open} unmountOnExit>
              <Stack spacing={1.5}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Kids Flashcards
                </Typography>
                <Typography variant="h6" sx={{ maxWidth: 720, color: 'text.primary', lineHeight: 1.6 }}>
                  Flip lively, colorful cards to help kids remember words and ideas. Add your own pictures to make the deck feel personal and fun!
                </Typography>
                <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {[
                    'Flip animations on every card',
                    'Custom pictures from your device',
                    'Custom audio on cards',
                    'Installable and ready for offline play',
                    'Save cards locally for quick reuse',
                    'Brought to you for free by Beanchain Coffee',
                  ].map((item) => (
                    <Box
                      key={item}
                      component="li"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.55)',
                        px: 1.25,
                        py: 0.85,
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.04)',
                        boxShadow: '0 8px 14px rgba(0, 0, 0, 0.05)',
                        fontWeight: 700,
                      }}
                    >
                      {item.includes('Beanchain') ? (
                        <Typography variant="body1" sx={{ m: 0, fontWeight: 700 }}>
                          Brought to you for free by{' '}
                          <Box
                            component="a"
                            href="https://bchain.coffee"
                            target="_blank"
                            rel="noreferrer"
                            sx={{ color: 'primary.main', fontWeight: 800, textDecoration: 'none' }}
                          >
                            Beanchain Coffee
                          </Box>
                        </Typography>
                      ) : (
                        item
                      )}
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Collapse>
          </Stack>
        </Grid>

        {open && (
          <Grid size={{ xs: 11, md: 4 }} order={{ xs: 3, md: 2}}>
            <Box
              aria-hidden
              sx={{
                position: 'relative',
                width: '100%',
                height: 240,
              }}
            >
              <Bubble
                sx={{
                  width: 140,
                  height: 140,
                  top: '8%',
                  left: '18%',
                  background: 'linear-gradient(135deg, rgba(255, 214, 102, 0.7), rgba(255, 126, 182, 0.6))',
                  animationDelay: '0s',
                }}
              />
              <Bubble
                sx={{
                  width: 180,
                  height: 180,
                  top: '32%',
                  left: '55%',
                  background: 'linear-gradient(135deg, rgba(126, 139, 255, 0.7), rgba(125, 224, 213, 0.65))',
                  animationDelay: '0.8s',
                }}
              />
              <Bubble
                sx={{
                  width: 110,
                  height: 110,
                  top: '10%',
                  left: '70%',
                  background: 'linear-gradient(135deg, rgba(255, 126, 182, 0.7), rgba(126, 139, 255, 0.65))',
                  animationDelay: '1.6s',
                }}
              />
            </Box>
          </Grid>
        )}

        <Grid size={{ xs: 1, md: 1 }} order={{ xs: 2, md: 2}} alignSelf={'flex-start'} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          <IconButton
            size="small"
            aria-label={open ? 'Collapse hero' : 'Expand hero'}
            onClick={() => setOpen((v) => !v)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(15,23,42,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            }}
          >
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
}

const Bubble = styled(Box)({
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(0px)',
  opacity: 0.85,
  animation: `${float} 12s ease-in-out infinite`,
});
