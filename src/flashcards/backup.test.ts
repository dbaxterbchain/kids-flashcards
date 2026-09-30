import { describe, expect, it } from 'vitest';
import { BackupError, parseBackup } from './backup';
import { readCard, readColor, readDataUrl, readLang } from './sanitize';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZF';

describe('sanitizing values from files', () => {
  it('keeps only embedded pictures and recordings', () => {
    expect(readDataUrl(PNG, 'image')).toBe(PNG);
    expect(readDataUrl(WAV, 'audio')).toBe(WAV);
    expect(readDataUrl('https://example.com/cat.png', 'image')).toBeUndefined();
    expect(readDataUrl('javascript:alert(1)', 'audio')).toBeUndefined();
    expect(readDataUrl(WAV, 'image')).toBeUndefined();
  });

  it('keeps plain colors, including color names, and nothing else', () => {
    expect(readColor('#fde68a')).toBe('#fde68a');
    expect(readColor('rgb(10, 20, 30)')).toBe('rgb(10, 20, 30)');
    expect(readColor(' red ')).toBe('red');
    expect(readColor('url(https://example.com/x.png)')).toBeUndefined();
    expect(readColor('red;background:url(x)')).toBeUndefined();
    expect(readColor('expression(alert(1))')).toBeUndefined();
  });

  it('keeps language tags', () => {
    expect(readLang('es')).toBe('es');
    expect(readLang('es-MX')).toBe('es-MX');
    expect(readLang('zh-Hant-TW')).toBe('zh-Hant-TW');
    expect(readLang('<script>')).toBeUndefined();
    expect(readLang('')).toBeUndefined();
  });

  it('reads a card, dropping unknown fields and unsafe values', () => {
    const card = readCard({
      id: 'c1',
      name: '  Grandma  ',
      imageUrl: 'https://example.com/tracker.png',
      audioUrl: WAV,
      backgroundColor: 'url(x)',
      lang: 'es-MX',
      extra: 'ignored',
      createdAt: 5,
    });
    expect(card).toEqual({
      id: 'c1',
      name: 'Grandma',
      imageUrl: '',
      frontText: undefined,
      createdAt: 5,
      audioUrl: WAV,
      lang: 'es-MX',
      setIds: [],
      backgroundColor: undefined,
      review: undefined,
    });
    expect(readCard({ id: 'c2', name: '   ' })).toBeNull();
    expect(readCard('not a card')).toBeNull();
  });
});

describe('parseBackup', () => {
  const backup = {
    format: 'kids-flashcards-backup',
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    cards: [
      { id: 'c1', name: 'Grandma', imageUrl: PNG, audioUrl: WAV, createdAt: 2, setIds: ['family'], backgroundColor: 'pink' },
      { id: 'c2', name: 'Red', imageUrl: '', backgroundColor: '#ef4444', createdAt: 1, setIds: [] },
    ],
    sets: [{ id: 'family', name: 'Family' }],
    profiles: [
      {
        id: 'p1',
        name: 'Ivy',
        avatar: '🦊',
        avatarImage: 'https://example.com/me.png',
        createdAt: 1,
        settings: { setIds: null, choiceCount: 9, promptMode: 'nonsense', roundSize: 500, readAloud: false, soundEffects: true },
      },
    ],
    progress: [
      { profileId: 'p1', cardId: 'c1', nextReviewAt: 10, intervalDays: 1, easeFactor: 2.5, reviewCount: 1, lastReviewedAt: 5 },
      { profileId: 'p1', cardId: 'deleted-card', nextReviewAt: 10, intervalDays: 1, easeFactor: 2.5, reviewCount: 1 },
      { profileId: 'gone', cardId: 'c1', nextReviewAt: 10, intervalDays: 1, easeFactor: 2.5, reviewCount: 1 },
    ],
    settings: { hiddenSetIds: ['family'], speakOnFlip: false },
  };

  it('keeps cards with their pictures, recordings and colors', () => {
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.cards).toHaveLength(2);
    expect(parsed.cards[0]).toMatchObject({ imageUrl: PNG, audioUrl: WAV, backgroundColor: 'pink', setIds: ['family'] });
    expect(parsed.sets).toEqual([{ id: 'family', name: 'Family' }]);
    expect(parsed.settings).toEqual({ hiddenSetIds: ['family'], speakOnFlip: false });
  });

  it('keeps children, fixing settings that are out of range', () => {
    const [profile] = parseBackup(JSON.stringify(backup)).profiles;
    expect(profile.avatarImage).toBeUndefined();
    expect(profile.settings).toMatchObject({
      choiceCount: 4,
      promptMode: 'find-picture',
      roundSize: 50,
      readAloud: false,
      introduceNew: true,
      autoAdjust: true,
    });
  });

  it('keeps how a child has been doing', () => {
    const withHistory = {
      ...backup,
      profiles: [
        { ...backup.profiles[0], recentResults: [true, 'yes', false], lastAdjustment: { at: 5, from: 2, to: 3 } },
        { ...backup.profiles[0], id: 'p2', lastAdjustment: { at: 5, from: 2, to: 9 } },
      ],
    };
    const [first, second] = parseBackup(JSON.stringify(withHistory)).profiles;
    expect(first.recentResults).toEqual([true, false]);
    expect(first.lastAdjustment).toEqual({ at: 5, from: 2, to: 3 });
    expect(second.lastAdjustment).toBeUndefined();
  });

  it('drops progress for cards or children that no longer exist', () => {
    const { progress } = parseBackup(JSON.stringify(backup));
    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({ profileId: 'p1', cardId: 'c1', reviewCount: 1 });
  });

  it('explains what went wrong with other files', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ format: 'kids-flashcards-set', version: 1 }))).toThrow(/Import a set/);
    expect(() => parseBackup(JSON.stringify({ ...backup, version: 99 }))).toThrow(/newer version/);
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(/isn't a Kids Flashcards backup/);
  });
});
