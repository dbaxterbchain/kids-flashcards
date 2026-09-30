import { ProgressByCard } from './review';
import { FlashcardData, FlashcardReview } from './types';

/**
 * Where a child is with a card:
 * - new: never answered.
 * - tricky: missed at least twice in the last few tries (or, for older progress without that history,
 *   missed last time).
 * - mastered: answered right over several spaced days, so reviews are a week or more apart.
 * - learning: everything in between.
 */
export type CardStatus = 'mastered' | 'learning' | 'tricky' | 'new';

export const CARD_STATUSES: CardStatus[] = ['mastered', 'learning', 'tricky', 'new'];

/** Days between reviews at which a card counts as mastered. */
export const MASTERED_INTERVAL_DAYS = 7;

const missedLastTime = (review: FlashcardReview) =>
  review.lastCorrect === false || (review.lastCorrect == null && (review.lastScore ?? 5) <= 2);

export function cardStatus(review: FlashcardReview | undefined): CardStatus {
  if (!review || review.lastReviewedAt === null) return 'new';
  if (review.intervalDays >= MASTERED_INTERVAL_DAYS && !missedLastTime(review)) return 'mastered';
  const misses = review.recent ? review.recent.filter((correct) => !correct).length : missedLastTime(review) ? 2 : 0;
  return misses >= 2 ? 'tricky' : 'learning';
}

export type ProgressSummary = {
  counts: Record<CardStatus, number>;
  cards: Record<CardStatus, FlashcardData[]>;
  total: number;
};

export function summarizeProgress(cards: FlashcardData[], progress: ProgressByCard): ProgressSummary {
  const summary: ProgressSummary = {
    counts: { mastered: 0, learning: 0, tricky: 0, new: 0 },
    cards: { mastered: [], learning: [], tricky: [], new: [] },
    total: cards.length,
  };
  cards.forEach((card) => {
    const status = cardStatus(progress[card.id]);
    summary.counts[status] += 1;
    summary.cards[status].push(card);
  });
  return summary;
}

/** When the child last practiced any card, or null if never. */
export function lastPracticedAt(progress: ProgressByCard) {
  const times = Object.values(progress).map((review) => review.lastReviewedAt ?? 0);
  const latest = Math.max(0, ...times);
  return latest > 0 ? latest : null;
}
