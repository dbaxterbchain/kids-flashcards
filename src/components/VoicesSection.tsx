import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { speakCard } from '../audio/sound';
import { baseLang, deviceLanguage, deviceVoices, pickVoice, preferredVoiceURI, setPreferredVoice } from '../audio/voices';
import { languageLabel } from '../flashcards/languages';
import { FlashcardData } from '../flashcards/types';
import { useVoices } from '../hooks/useVoices';
import { MissingVoiceAlert } from './MissingVoiceAlert';

/** A language the cards are read in, with a word to try the voice on. */
type Language = { lang: string; sample: string; own: boolean };

const voiceName = (voice: SpeechSynthesisVoice) => `${voice.name}${voice.localService ? '' : ' (needs the internet)'}`;

/** Lets a grown-up hear and pick the voice that reads each language their cards use. */
export function VoicesSection({ cards }: { cards: FlashcardData[] }) {
  useVoices();
  if (!('speechSynthesis' in window)) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Voices</Typography>
        <Typography variant="body2" color="text.secondary">
          This browser can&apos;t read cards aloud. Cards still play your own recordings.
        </Typography>
      </Stack>
    );
  }

  const voices = deviceVoices();
  const languages: Language[] = [];
  const add = (lang: string, sample: string, own: boolean) => {
    if (!languages.some((language) => baseLang(language.lang) === baseLang(lang))) languages.push({ lang, sample, own });
  };
  add(deviceLanguage(), cards.find((card) => !card.lang)?.name ?? 'Hello', true);
  cards.forEach((card) => card.lang && add(card.lang, card.name, false));

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle2">Voices</Typography>
        <Typography variant="body2" color="text.secondary">
          Cards without your own recording are read by one of this device&apos;s voices. Pick the one that sounds best
          for each language your cards use.
        </Typography>
      </Box>
      {voices.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          This device hasn&apos;t listed its voices yet.
        </Typography>
      ) : (
        languages.map((language) => <VoiceChoice key={language.lang} language={language} voices={voices} />)
      )}
    </Stack>
  );
}

function VoiceChoice({ language, voices }: { language: Language; voices: SpeechSynthesisVoice[] }) {
  const { lang, sample, own } = language;
  const options = voices.filter((voice) => baseLang(voice.lang) === baseLang(lang));
  if (options.length === 0) return <MissingVoiceAlert lang={lang} />;
  const automatic = pickVoice(voices, lang);
  const chosen = preferredVoiceURI(lang);
  const label = `${languageLabel(own ? baseLang(lang) : lang)}${own ? ' (your language)' : ''}`;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
      <TextField
        select
        size="small"
        label={label}
        value={chosen && options.some((voice) => voice.voiceURI === chosen) ? chosen : ''}
        onChange={(event) => setPreferredVoice(lang, event.target.value || null)}
        sx={{ flexGrow: 1, minWidth: 0 }}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
      >
        <MenuItem value="" sx={{ whiteSpace: 'normal' }}>
          Automatic{automatic ? `: ${voiceName(automatic)}` : ''}
        </MenuItem>
        {options.map((voice) => (
          <MenuItem key={voice.voiceURI} value={voice.voiceURI} sx={{ whiteSpace: 'normal' }}>
            {voiceName(voice)}
          </MenuItem>
        ))}
      </TextField>
      <Button
        startIcon={<VolumeUpIcon />}
        onClick={() => speakCard({ name: sample, lang })}
        aria-label={`Hear the ${label} voice`}
        sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}
      >
        Hear it
      </Button>
    </Stack>
  );
}
