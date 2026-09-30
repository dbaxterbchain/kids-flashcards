import { describe, expect, it } from 'vitest';
import { pickVoice, VoiceOption } from './voices';

const voice = (name: string, lang: string, extra: Partial<VoiceOption> = {}): VoiceOption => ({
  name,
  lang,
  voiceURI: name,
  default: false,
  localService: true,
  ...extra,
});

// Roughly what Chrome lists on a Windows computer.
const CHROME = [
  voice('Microsoft David', 'en-US', { default: true }),
  voice('Google US English', 'en-US', { localService: false }),
  voice('Google español', 'es-ES', { localService: false }),
  voice('Google español de Estados Unidos', 'es-US', { localService: false }),
  voice('Google français', 'fr-FR', { localService: false }),
];

describe('picking a voice', () => {
  it('uses a voice for the exact region when there is one', () => {
    expect(pickVoice(CHROME, 'fr-FR')?.name).toBe('Google français');
    expect(pickVoice([...CHROME, voice('Microsoft Sabina', 'es-MX')], 'es-MX')?.name).toBe('Microsoft Sabina');
  });

  it('prefers a nearby region, like Latin American Spanish for Mexican Spanish', () => {
    expect(pickVoice(CHROME, 'es-MX')?.name).toBe('Google español de Estados Unidos');
  });

  it('falls back to any voice for the language', () => {
    expect(pickVoice(CHROME, 'fr-CA')?.name).toBe('Google français');
    expect(pickVoice(CHROME, 'es_ES')?.name).toBe('Google español');
  });

  it('prefers the default voice', () => {
    expect(pickVoice(CHROME, 'en-US')?.name).toBe('Microsoft David');
  });

  it('finds nothing for a language the device has no voice for', () => {
    expect(pickVoice(CHROME, 'de-DE')).toBeUndefined();
  });

  it("uses a grown-up's choice when the device has it", () => {
    expect(pickVoice(CHROME, 'es-MX', 'Google español')?.name).toBe('Google español');
    expect(pickVoice(CHROME, 'es-MX', 'A voice from another device')?.name).toBe('Google español de Estados Unidos');
    // A choice of a voice for another language doesn't count.
    expect(pickVoice(CHROME, 'es-MX', 'Google français')?.name).toBe('Google español de Estados Unidos');
  });

  it("skips voices that need the internet when it's offline", () => {
    expect(pickVoice([...CHROME, voice('Microsoft Sabina', 'es-MX')], 'es-ES', null, false)?.name).toBe('Microsoft Sabina');
    expect(pickVoice(CHROME, 'fr-FR', null, false)).toBeUndefined();
  });
});
