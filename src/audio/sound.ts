// Sound for practice: the card's recording (or the device's voice when there is none) plus short
// synthesized chimes, so no audio files need to be shipped or cached.

type SoundKind = 'correct' | 'wrong' | 'finish';

// A valid, empty WAV file used to unlock audio playback.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

const NOTES: Record<SoundKind, { frequency: number; at: number }[]> = {
  correct: [
    { frequency: 660, at: 0 },
    { frequency: 880, at: 0.12 },
  ],
  wrong: [{ frequency: 220, at: 0 }],
  finish: [
    { frequency: 523, at: 0 },
    { frequency: 659, at: 0.12 },
    { frequency: 784, at: 0.24 },
    { frequency: 1047, at: 0.36 },
  ],
};

let audioContext: AudioContext | null = null;
// iOS only lets an audio element play without a tap if it was first played during one, so one
// element is unlocked when practice starts and reused for every recording.
let voice: HTMLAudioElement | null = null;

/** Call from a tap handler (e.g. Start) so later sounds are allowed to play. */
export function unlockAudio() {
  try {
    const AudioContextClass =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !audioContext) audioContext = new AudioContextClass();
    void audioContext?.resume();
  } catch (error) {
    console.warn('Sound effects are unavailable', error);
  }

  if (!voice && typeof Audio !== 'undefined') {
    voice = new Audio();
    voice.src = SILENT_WAV;
    voice.play().catch(() => undefined);
  }

  if ('speechSynthesis' in window) {
    // Safari ignores speech that doesn't start from a tap until one utterance has.
    const warmUp = new SpeechSynthesisUtterance('');
    warmUp.volume = 0;
    window.speechSynthesis.speak(warmUp);
  }
}

export function playSound(kind: SoundKind) {
  if (!audioContext) return;
  const context = audioContext;
  const start = context.currentTime;
  NOTES[kind].forEach(({ frequency, at }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'wrong' ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + at);
    gain.gain.exponentialRampToValueAtTime(0.2, start + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start + at);
    oscillator.stop(start + at + 0.32);
  });
}

// Bumped whenever speech starts or stops, so a late failure can't talk over what came next.
let speechToken = 0;

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  speechToken += 1;
  voice?.pause();
  if ('speechSynthesis' in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
  }
}

/** Says a card's word: the parent's recording when there is one, otherwise the device's voice. */
export function speakCard(card: { name: string; audioUrl?: string }) {
  stopSpeaking();
  if (!card.audioUrl) {
    speakText(card.name);
    return;
  }
  const token = speechToken;
  if (!voice) voice = new Audio();
  voice.src = card.audioUrl;
  voice.play().catch((error: unknown) => {
    // Fall back to the device's voice only when the recording can't play at all (not when it was
    // interrupted on purpose).
    const blocked = error instanceof DOMException && ['NotAllowedError', 'NotSupportedError'].includes(error.name);
    if (blocked && token === speechToken) speakText(card.name);
  });
}
