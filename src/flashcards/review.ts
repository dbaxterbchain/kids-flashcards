import { FlashcardData, FlashcardReview } from './types';

const MIN_EASE_FACTOR = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;
const FAILED_RETRY_MS = 10 * 60 * 1000;

/** One child's review state for each card, keyed by card id. */
export type ProgressByCard = Record<string, FlashcardReview>;

export function createInitialReview(now: number = Date.now()): FlashcardReview {
  return {
    lastReviewedAt: null,
    nextReviewAt: now,
    intervalDays: 0,
    easeFactor: 2.5,
    reviewCount: 0,
  };
}

/** How many recent answers are kept per card. */
export const RECENT_RESULTS = 5;

export function applyReviewResult(
  review: FlashcardReview | undefined,
  correct: boolean,
  now: number = Date.now(),
): FlashcardReview {
  const recent = [...(review?.recent ?? []), correct].slice(-RECENT_RESULTS);

  // Getting a card right before it's due (extra practice) is great, but it isn't spaced practice,
  // so it doesn't stretch the time until the next review. A miss always counts.
  if (correct && review && now < review.nextReviewAt) {
    return { ...review, lastReviewedAt: now, lastCorrect: true, recent };
  }

  let { intervalDays, easeFactor, reviewCount } = review ?? createInitialReview(now);

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
    lastReviewedAt: now,
    nextReviewAt,
    intervalDays,
    easeFactor,
    reviewCount,
    lastCorrect: correct,
    recent,
  };
}

export type PracticeQueue = {
  queue: FlashcardData[];
  hasDue: boolean;
  dueCount: number;
  nextReviewAt?: number;
};

export function buildPracticeQueue(
  cards: FlashcardData[],
  progress: ProgressByCard,
  now: number = Date.now(),
): PracticeQueue {
  const reviewOf = (card: FlashcardData) => progress[card.id] ?? createInitialReview(now);
  const isMissed = (review: FlashcardReview) =>
    review.lastCorrect === false || (review.lastCorrect == null && (review.lastScore ?? 5) <= 2);
  const due = cards.filter((card) => reviewOf(card).nextReviewAt <= now);
  const upcoming = cards.filter((card) => reviewOf(card).nextReviewAt > now);

  const sortByPriority = (a: FlashcardData, b: FlashcardData) => {
    const aReview = reviewOf(a);
    const bReview = reviewOf(b);
    const aMissed = isMissed(aReview);
    const bMissed = isMissed(bReview);
    if (aMissed !== bMissed) return aMissed ? -1 : 1;
    if (aMissed && bMissed) {
      return (bReview.lastReviewedAt ?? 0) - (aReview.lastReviewedAt ?? 0);
    }
    return aReview.nextReviewAt - bReview.nextReviewAt;
  };

  const sorted = [...cards].sort(sortByPriority);

  if (due.length > 0) {
    const dueQueue = [...due].sort(sortByPriority);
    const upcomingQueue = [...upcoming].sort((a, b) => reviewOf(a).nextReviewAt - reviewOf(b).nextReviewAt);
    return { queue: [...dueQueue, ...upcomingQueue], hasDue: true, dueCount: due.length };
  }

  return { queue: sorted, hasDue: false, dueCount: 0, nextReviewAt: sorted[0] ? reviewOf(sorted[0]).nextReviewAt : undefined };
}
