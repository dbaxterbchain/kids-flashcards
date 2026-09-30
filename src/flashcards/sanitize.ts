import { FlashcardData, FlashcardReview, FlashcardSet } from './types';

// Backups and shared sets may come from someone else, so only known fields and safe values are kept:
// pictures and recordings must be embedded data (never links that would load from elsewhere), and
// colors can't carry url() or other CSS.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.slice(0, maxLength) : undefined;

export const readNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

export const readDataUrl = (value: unknown, kind: 'image' | 'audio') =>
  typeof value === 'string' && value.startsWith(`data:${kind}/`) ? value : undefined;

// Hex colors, rgb()/hsl() with plain numbers, or a color name like "red" (cards made before the color
// picker could hold any text).
const COLOR_PATTERNS = [/^#[0-9a-f]{3,8}$/i, /^(rgb|hsl)a?\([\d\s.,%/+-]{1,60}\)$/i, /^[a-z]{3,20}$/i];

export const readColor = (value: unknown) =>
  typeof value === 'string' && COLOR_PATTERNS.some((pattern) => pattern.test(value.trim())) ? value.trim() : undefined;

/** A language tag like "es" or "es-MX", used to pick the voice that reads a card aloud. */
export const readLang = (value: unknown) =>
  typeof value === 'string' && /^[a-z]{2,3}(-[a-z0-9]{2,8}){0,2}$/i.test(value) ? value : undefined;

export const readIds = (value: unknown) =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && id.length <= 100) : [];

export function readReview(value: unknown): FlashcardReview | undefined {
  if (!isRecord(value)) return undefined;
  const nextReviewAt = readNumber(value.nextReviewAt);
  const intervalDays = readNumber(value.intervalDays);
  const easeFactor = readNumber(value.easeFactor);
  const reviewCount = readNumber(value.reviewCount);
  if (nextReviewAt === undefined || intervalDays === undefined || easeFactor === undefined || reviewCount === undefined) {
    return undefined;
  }
  return {
    lastReviewedAt: readNumber(value.lastReviewedAt) ?? null,
    nextReviewAt,
    intervalDays,
    easeFactor,
    reviewCount,
    lastCorrect: typeof value.lastCorrect === 'boolean' ? value.lastCorrect : undefined,
    recent: Array.isArray(value.recent)
      ? value.recent.filter((result): result is boolean => typeof result === 'boolean').slice(-10)
      : undefined,
  };
}

export function readCard(value: unknown): FlashcardData | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 100);
  const name = readText(value.name, 200)?.trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    imageUrl: readDataUrl(value.imageUrl, 'image') ?? '',
    frontText: readText(value.frontText, 200)?.trim() || undefined,
    createdAt: readNumber(value.createdAt) ?? Date.now(),
    audioUrl: readDataUrl(value.audioUrl, 'audio'),
    lang: readLang(value.lang),
    prompt: readText(value.prompt, 200)?.trim() || undefined,
    explain: readText(value.explain, 1000)?.trim() || undefined,
    setIds: readIds(value.setIds),
    backgroundColor: readColor(value.backgroundColor),
    review: readReview(value.review),
  };
}

export function readSet(value: unknown): FlashcardSet | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id, 100);
  const name = readText(value.name, 100)?.trim();
  const about = readText(value.about, 1000)?.trim() || undefined;
  return id && name ? { id, name, about } : null;
}

export const readList = <T>(value: unknown, read: (item: unknown) => T | null) =>
  Array.isArray(value) ? value.map(read) : [];

/** Drops unreadable entries; later entries with the same key replace earlier ones. */
export function uniqueBy<T>(items: (T | null)[], key: (item: T) => string): T[] {
  const byKey = new Map<string, T>();
  items.forEach((item) => {
    if (item) byKey.set(key(item), item);
  });
  return [...byKey.values()];
}
