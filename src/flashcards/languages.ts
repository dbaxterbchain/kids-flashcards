/** Languages a card can be read aloud in, when the parent hasn't recorded it. */
export const READ_ALOUD_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-MX', label: 'Spanish (Latin America)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'zh-CN', label: 'Chinese (Mandarin)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'vi-VN', label: 'Vietnamese' },
];

/** A readable name for a language tag, including ones that aren't in the list (e.g. from a shared set). */
export function languageLabel(lang: string) {
  const known = READ_ALOUD_LANGUAGES.find((option) => option.value.toLowerCase() === lang.toLowerCase());
  if (known) return known.label;
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) ?? lang;
  } catch {
    return lang;
  }
}
