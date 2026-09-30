import { Alert } from '@mui/material';
import { languageLabel } from '../flashcards/languages';

/** Explains that this device has no voice for a language, and what to do about it. */
export function MissingVoiceAlert({ lang, words = 'words' }: { lang: string; words?: string }) {
  const label = languageLabel(lang);
  return (
    <Alert severity="warning">
      This device has no {label} voice, so {label} {words} would be read by a voice for another language and can
      sound wrong. Add a {label} voice in the device&apos;s speech settings, or record your own voice on each card. On
      a computer, Google Chrome and Microsoft Edge come with voices for many languages.
    </Alert>
  );
}
