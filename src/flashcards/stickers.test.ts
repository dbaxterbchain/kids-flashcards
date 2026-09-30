import { describe, expect, it } from 'vitest';
import { defaultPracticeSettings } from './practice';
import { awardSticker, dayKey, practiceStreak, recordPracticeDay, SHINY_STICKERS, STICKERS } from './stickers';
import { ChildProfile } from './types';

const child = (overrides: Partial<ChildProfile> = {}): ChildProfile => ({
  id: 'kid',
  name: 'Ivy',
  avatar: '🦊',
  createdAt: 0,
  settings: defaultPracticeSettings(),
  ...overrides,
});

const day = (date: string, hour = 12) => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();

describe('stickers', () => {
  it('gives a sticker the child does not have yet', () => {
    const owned = STICKERS.slice(0, -1).map((emoji) => ({ emoji, at: 0 }));
    const { profile, sticker } = awardSticker(child({ stickers: owned }), { perfect: false, now: 5 });
    expect(sticker).toEqual({ emoji: STICKERS[STICKERS.length - 1], at: 5 });
    expect(profile.stickers).toHaveLength(STICKERS.length);
  });

  it('gives a shiny sticker for a perfect round', () => {
    const { sticker } = awardSticker(child(), { perfect: true });
    expect(SHINY_STICKERS).toContain(sticker.emoji);
    expect(sticker.shiny).toBe(true);
  });

  it('keeps giving stickers after the whole pack is collected', () => {
    const owned = SHINY_STICKERS.map((emoji) => ({ emoji, at: 0, shiny: true }));
    const { sticker } = awardSticker(child({ stickers: owned }), { perfect: true });
    expect(SHINY_STICKERS).toContain(sticker.emoji);
  });

  it('are all emoji shown in color', () => {
    for (const emoji of [...STICKERS, ...SHINY_STICKERS]) {
      expect(/\p{Emoji_Presentation}|️/u.test(emoji), emoji).toBe(true);
    }
    expect(new Set([...STICKERS, ...SHINY_STICKERS]).size).toBe(STICKERS.length + SHINY_STICKERS.length);
  });
});

describe('streaks', () => {
  it('records each practice day once', () => {
    const once = recordPracticeDay(child(), day('2026-03-02', 9));
    const twice = recordPracticeDay(once, day('2026-03-02', 18));
    expect(twice.practiceDays).toEqual(['2026-03-02']);
    expect(dayKey(day('2026-03-02', 23))).toBe('2026-03-02');
  });

  it('counts days in a row up to today', () => {
    expect(practiceStreak(['2026-02-28', '2026-03-01', '2026-03-02'], day('2026-03-02'))).toBe(3);
  });

  it("keeps yesterday's streak going until today is over", () => {
    expect(practiceStreak(['2026-03-01', '2026-03-02'], day('2026-03-03'))).toBe(2);
  });

  it('starts over after a missed day', () => {
    expect(practiceStreak(['2026-02-27', '2026-02-28', '2026-03-02'], day('2026-03-02'))).toBe(1);
    expect(practiceStreak(['2026-02-27'], day('2026-03-02'))).toBe(0);
    expect(practiceStreak(undefined)).toBe(0);
  });
});
