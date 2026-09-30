import { ChildProfile, Sticker } from './types';

// Stickers earned by finishing a round. Perfect rounds earn a shiny one from a smaller, special pack.
export const STICKERS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧',
  '🐤', '🦉', '🐝', '🦋', '🐞', '🐢', '🦖', '🐙', '🦀', '🐠', '🐬', '🐳', '🍎', '🍓', '🍉', '🍌',
  '🍩', '🍪', '🧁', '🍭', '🍦', '🌸', '🌻', '🍄', '🌵', '⛄', '🎈', '🎁', '🎨', '🎸', '🚗', '🚒',
  '🚜', '⛵', '🚂', '⚽', '🏀', '🧸', '🪁',
];

export const SHINY_STICKERS = ['🦄', '🌈', '👑', '💎', '🏆', '🌟', '🚀', '🐉', '🦚', '🎆', '🪐', '🧜‍♀️'];

/**
 * Gives the child a sticker for a finished round, preferring one they don't have yet (until they've
 * collected the whole pack).
 */
export function awardSticker(
  profile: ChildProfile,
  { perfect, now = Date.now(), random = Math.random }: { perfect: boolean; now?: number; random?: () => number },
): { profile: ChildProfile; sticker: Sticker } {
  const pack = perfect ? SHINY_STICKERS : STICKERS;
  const owned = new Set((profile.stickers ?? []).map((sticker) => sticker.emoji));
  const unseen = pack.filter((emoji) => !owned.has(emoji));
  const choices = unseen.length > 0 ? unseen : pack;
  const sticker: Sticker = { emoji: choices[Math.floor(random() * choices.length)], at: now, ...(perfect ? { shiny: true } : {}) };
  return { profile: { ...profile, stickers: [...(profile.stickers ?? []), sticker] }, sticker };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A day in the device's own time zone, as YYYY-MM-DD. */
export function dayKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** How many days of practice are kept (enough for any streak worth celebrating). */
const DAYS_KEPT = 60;

/** Notes that the child finished a round today. */
export function recordPracticeDay(profile: ChildProfile, now = Date.now()): ChildProfile {
  const today = dayKey(now);
  const days = profile.practiceDays ?? [];
  if (days.includes(today)) return profile;
  return { ...profile, practiceDays: [...days, today].slice(-DAYS_KEPT) };
}

/**
 * Days in a row with practice, counting back from today, or from yesterday when today hasn't had a
 * round yet (the streak isn't over until the day is). A missed day just starts a new count.
 */
export function practiceStreak(practiceDays: string[] | undefined, now = Date.now()) {
  const days = new Set(practiceDays ?? []);
  const today = new Date(now);
  const dayBefore = (offset: number) => dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset).getTime());
  let offset = days.has(dayBefore(0)) ? 0 : 1;
  let streak = 0;
  while (days.has(dayBefore(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}
