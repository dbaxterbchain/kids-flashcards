import { FlashcardData, FlashcardReview } from './types';

const MIN_EASE_FACTOR = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;
const FAILED_RETRY_MS = 10 * 60 * 1000;

export function createInitialReview(now: number = Date.now()): FlashcardReview {
  return {
    lastReviewedAt: null,
    nextReviewAt: now,
    intervalDays: 0,
    easeFactor: 2.5,
    reviewCount: 0,
  };
}

export function ensureReview(card: FlashcardData, now: number = Date.now()): FlashcardData {
  if (card.review) return card;
  return { ...card, review: createInitialReview(now) };
}

export function applyReviewResult(
  card: FlashcardData,
  correct: boolean,
  now: number = Date.now(),
): FlashcardData {
  const review = card.review ?? createInitialReview(now);
  let { intervalDays, easeFactor, reviewCount } = review;

  if (!correct) {
    intervalDays = 0;
    reviewCount = 0;
  } else {
    if (reviewCount === 0) {
      intervalDays = 1;
    } else if (reviewCount === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    reviewCount += 1;
  }

  if (correct) {
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + 0.05);
  } else {
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  }

  const nextReviewAt = correct ? now + intervalDays * DAY_MS : now + FAILED_RETRY_MS;

  return {
    ...card,
    review: {
      lastReviewedAt: now,
      nextReviewAt,
      intervalDays,
      easeFactor,
      reviewCount,
      lastCorrect: correct,
    },
  };
}

export type PracticeQueue = {
  queue: FlashcardData[];
  hasDue: boolean;
  dueCount: number;
  nextReviewAt?: number;
};

export function buildPracticeQueue(cards: FlashcardData[], now: number = Date.now()): PracticeQueue {
  const normalized = cards.map((card) => ensureReview(card, now));
  const due = normalized.filter((card) => (card.review?.nextReviewAt ?? now) <= now);

  const sortByPriority = (a: FlashcardData, b: FlashcardData) => {
    const aMissed = a.review?.lastCorrect === false || (a.review?.lastCorrect == null && (a.review?.lastScore ?? 5) <= 2);
    const bMissed = b.review?.lastCorrect === false || (b.review?.lastCorrect == null && (b.review?.lastScore ?? 5) <= 2);
    if (aMissed !== bMissed) return aMissed ? -1 : 1;
    if (aMissed && bMissed) {
      return (b.review?.lastReviewedAt ?? 0) - (a.review?.lastReviewedAt ?? 0);
    }
    return (a.review?.nextReviewAt ?? now) - (b.review?.nextReviewAt ?? now);
  };

  const sorted = [...normalized].sort(sortByPriority);

  if (due.length > 0) {
    const queue = [...due].sort(sortByPriority);
    return { queue, hasDue: true, dueCount: due.length };
  }

  return { queue: sorted, hasDue: false, dueCount: 0, nextReviewAt: sorted[0]?.review?.nextReviewAt };
}
