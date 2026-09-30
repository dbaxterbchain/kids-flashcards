import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { canRecord } from '../audio/sound';
import { GAME_INFO, GameKind } from '../flashcards/games';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { ChildAvatar } from './ChildAvatar';
import { Explanation, ExplainDialog } from './ExplainDialog';
import { FlashcardGrid } from './FlashcardGrid';
import { KeepRangesTogether } from './KeepRangesTogether';
import { SayItDialog } from './SayItDialog';

type PlaySetViewProps = {
  title: string;
  /** The set's "How this set works" introduction. */
  about?: string;
  cards: FlashcardData[];
  speakOnFlip: boolean;
  /** The child who would practice these cards, if any. */
  practiceProfile: ChildProfile | null;
  onBack: () => void;
  onPractice: () => void;
  /** Games that can be played with these cards. */
  games?: GameKind[];
  onPlayGame?: (game: GameKind) => void;
  /** Whether cards get a "Say it" button (when the device can record). */
  sayIt?: boolean;
};

/** One set's cards for kids to flip through, with a shortcut to practice just this set. */
export function PlaySetView({
  title,
  about,
  cards,
  speakOnFlip,
  practiceProfile,
  onBack,
  onPractice,
  games = [],
  onPlayGame,
  sayIt = false,
}: PlaySetViewProps) {
  const [sayingCard, setSayingCard] = useState<FlashcardData | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const explained = cards.some((card) => card.explain);
  return (
    <Box component="section" aria-labelledby="set-heading">
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <IconButton
          onClick={onBack}
          aria-label="Back to all sets"
          size="large"
          sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          id="set-heading"
          variant="h5"
          component="h1"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            // Long names wrap to a second line instead of being cut off.
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          <KeepRangesTogether text={title} />
        </Typography>
        {practiceProfile && cards.length >= 2 && (
          <Button
            variant="contained"
            size="large"
            onClick={onPractice}
            aria-label={`Practice ${title} with ${practiceProfile.name}`}
            startIcon={<ChildAvatar profile={practiceProfile} size={26} />}
            sx={{ flexShrink: 0 }}
          >
            Practice
          </Button>
        )}
      </Stack>
      {games.length > 0 && onPlayGame && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }} role="group" aria-label="Games">
          {games.map((game) => (
            <Button
              key={game}
              variant="outlined"
              onClick={() => onPlayGame(game)}
              startIcon={
                <Box component="span" aria-hidden sx={{ fontSize: '1.25rem !important', lineHeight: 1 }}>
                  {GAME_INFO[game].emoji}
                </Box>
              }
              sx={{ bgcolor: 'background.paper', borderRadius: 999 }}
            >
              {GAME_INFO[game].name}
            </Button>
          ))}
        </Stack>
      )}
      {about && (
        <Button
          variant="outlined"
          color="warning"
          startIcon={<LightbulbIcon />}
          onClick={() => setExplanation({ setName: title, text: about })}
          sx={{ mb: 1.5, bgcolor: 'background.paper', borderRadius: 999 }}
        >
          How this set works
        </Button>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {explained ? 'Tap a card to flip it over. Tap the light bulb to find out how it works.' : 'Tap a card to flip it over.'}
      </Typography>
      <FlashcardGrid
        cards={cards}
        speakOnFlip={speakOnFlip}
        onSayIt={sayIt && canRecord() ? setSayingCard : undefined}
        onExplain={(card) => setExplanation({ card, text: card.explain ?? '' })}
      />
      <SayItDialog card={sayingCard} onClose={() => setSayingCard(null)} />
      <ExplainDialog explanation={explanation} onClose={() => setExplanation(null)} />
    </Box>
  );
}
