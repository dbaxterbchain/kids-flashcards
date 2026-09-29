import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Avatar, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { avatarColor } from '../flashcards/practice';
import { ChildProfile, FlashcardData } from '../flashcards/types';
import { FlashcardGrid } from './FlashcardGrid';

type PlaySetViewProps = {
  title: string;
  cards: FlashcardData[];
  speakOnFlip: boolean;
  /** The child who would practice these cards, if any. */
  practiceProfile: ChildProfile | null;
  onBack: () => void;
  onPractice: () => void;
};

/** One set's cards for kids to flip through, with a shortcut to practice just this set. */
export function PlaySetView({ title, cards, speakOnFlip, practiceProfile, onBack, onPractice }: PlaySetViewProps) {
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
        <Typography id="set-heading" variant="h5" component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0, fontWeight: 800 }}>
          {title}
        </Typography>
        {practiceProfile && cards.length >= 2 && (
          <Button
            variant="contained"
            size="large"
            onClick={onPractice}
            aria-label={`Practice ${title} with ${practiceProfile.name}`}
            startIcon={
              <Avatar sx={{ width: 26, height: 26, fontSize: 16, bgcolor: avatarColor(practiceProfile.avatar) }}>
                {practiceProfile.avatar}
              </Avatar>
            }
            sx={{ flexShrink: 0 }}
          >
            Practice
          </Button>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tap a card to flip it over.
      </Typography>
      <FlashcardGrid cards={cards} speakOnFlip={speakOnFlip} />
    </Box>
  );
}
