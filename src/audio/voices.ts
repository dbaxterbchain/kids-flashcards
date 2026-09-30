// The device's text-to-speech voices: which one reads each language, a grown-up's choice of voice, and
// which languages have no voice at all (those would be read with another language's voice).

/** The parts of a voice this app uses, so tests can make their own. */
export type VoiceOption = Pick<SpeechSynthesisVoice, 'name' | 'lang' | 'voiceURI' | 'default' | 'localService'>;

const PREFERENCES_KEY = 'kids-flashcards-voices';

const normalizeLang = (lang: string) => lang.replace(/_/g, '-').toLowerCase();

/** The language without its region: "es" for "es-MX". */
export const baseLang = (lang: string) => normalizeLang(lang).split('-')[0];

// Regions that sound closest when there's no voice for the exact one, e.g. Latin American Spanish.
const NEARBY_REGIONS: Record<string, string[]> = {
  'es-mx': ['es-us', 'es-419'],
  'es-us': ['es-mx', 'es-419'],
  'es-419': ['es-mx', 'es-us'],
  'en-gb': ['en-ie', 'en-au', 'en-nz'],
  'pt-br': [],
  'zh-cn': ['cmn-cn'],
};

/**
 * The voice to read a language with: the grown-up's choice when this device has it, else a voice for
 * the exact region, a nearby region, then any region, preferring the device's default voice.
 */
export function pickVoice<V extends VoiceOption>(voices: V[], lang: string, preferredURI?: string | null, online = true) {
  const wanted = normalizeLang(lang);
  const sameLanguage = voices.filter((voice) => baseLang(voice.lang) === baseLang(lang));
  const preferred = preferredURI ? sameLanguage.find((voice) => voice.voiceURI === preferredURI) : undefined;
  if (preferred) return preferred;
  // Voices that need the internet (like Chrome's) can't speak offline.
  const usable = online ? sameLanguage : sameLanguage.filter((voice) => voice.localService);
  const inRegion = (region: string) => usable.filter((voice) => normalizeLang(voice.lang) === region);
  const ranked = [wanted, ...(NEARBY_REGIONS[wanted] ?? [])].flatMap(inRegion);
  const candidates = ranked.length > 0 ? ranked : usable;
  return candidates.find((voice) => voice.default) ?? candidates[0];
}

// --- The device's voices ---------------------------------------------------------------------------

let knownVoices: SpeechSynthesisVoice[] = [];
let version = 0;
let listening = false;
const listeners = new Set<() => void>();

const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** The voices this device has. Some browsers list them a moment after the page loads. */
export function deviceVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) knownVoices = voices;
  return knownVoices;
}

function listen() {
  if (listening || !canSpeak()) return;
  listening = true;
  const update = () => {
    deviceVoices();
    notify();
  };
  const synth = window.speechSynthesis;
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', update);
  else synth.onvoiceschanged = update;
}

/** Asks for the voices early, so they're ready by the first card. */
export function warmUpVoices() {
  listen();
  deviceVoices();
}

export function subscribeToVoices(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Changes whenever the voices or the grown-up's choices change. */
export const voicesVersion = () => version;

// --- A grown-up's choice of voice, per language ------------------------------------------------------

function readPreferences(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
    return value && typeof value === 'object' ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** The voice a grown-up picked for a language on this device, if any. */
export const preferredVoiceURI = (lang: string): string | undefined => readPreferences()[baseLang(lang)];

/** Picks the voice for a language, or goes back to the automatic choice with null. */
export function setPreferredVoice(lang: string, voiceURI: string | null) {
  const preferences = readPreferences();
  if (voiceURI) preferences[baseLang(lang)] = voiceURI;
  else delete preferences[baseLang(lang)];
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Unable to save the voice choice', error);
  }
  notify();
}

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** The voice that reads a language on this device, or undefined when it has none. */
export const voiceFor = (lang: string) => pickVoice(deviceVoices(), lang, preferredVoiceURI(lang), isOnline());

/** The language the device reads cards in when a card doesn't say. */
export const deviceLanguage = () => (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

export type VoiceStatus = 'ready' | 'missing' | 'unknown';

/**
 * Whether this device has a voice for a language. "unknown" while it hasn't listed its voices, or when
 * it can't speak at all.
 */
export function voiceStatus(lang: string): VoiceStatus {
  const voices = deviceVoices();
  if (voices.length === 0) return 'unknown';
  return pickVoice(voices, lang) ? 'ready' : 'missing';
}
