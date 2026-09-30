import { describe, expect, it } from 'vitest';
import { cardStatus, lastPracticedAt, summarizeProgress } from './progressSummary';
import { applyReviewResult } from './review';
import { testCard } from './testCards';
import { FlashcardReview } from './types';

const NOW = Date.UTC(2026, 0, 1);

/** Answers a card in order, each time when it's due. */
function answer(results: boolean[]): FlashcardReview {
  let review: FlashcardReview | undefined;
  let now = NOW;
  for (const correct of results) {
    review = applyReviewResult(review, correct, now);
    now = review.nextReviewAt;
  }
  return review!;
}

describe('cardStatus', () => {
  it('is new until the child answers the card', () => {
    expect(cardStatus(undefined)).toBe('new');
  });

  it('is learning after a few answers, even with one miss', () => {
    expect(cardStatus(answer([true]))).toBe('learning');
    expect(cardStatus(answer([false, true]))).toBe('learning');
    expect(cardStatus(answer([false]))).toBe('learning');
  });

  it('is tricky after two misses in the last few tries', () => {
    expect(cardStatus(answer([false, true, false]))).toBe('tricky');
    expect(cardStatus(answer([false, false, true]))).toBe('tricky');
  });

  it('is mastered once reviews are a week apart', () => {
    expect(cardStatus(answer([true, true, true]))).toBe('mastered');
    // Two misses long ago don't hold back a card that's since been mastered.
    expect(cardStatus(answer([false, false, true, true, true]))).toBe('mastered');
  });

  it('treats older progress without history as tricky only when missed last time', () => {
    const legacy = { lastReviewedAt: NOW, nextReviewAt: NOW, intervalDays: 0, easeFactor: 2.3, reviewCount: 0 };
    expect(cardStatus({ ...legacy, lastCorrect: false })).toBe('tricky');
    expect(cardStatus({ ...legacy, lastCorrect: true })).toBe('learning');
  });
});

describe('summarizeProgress', () => {
  it('counts and groups cards by status', () => {
    const cards = ['a', 'b', 'c', 'd'].map((id) => testCard(id));
    const progress = { a: answer([true, true, true]), b: answer([true]), c: answer([false, false]) };
    const summary = summarizeProgress(cards, progress);
    expect(summary.counts).toEqual({ mastered: 1, learning: 1, tricky: 1, new: 1 });
    expect(summary.cards.tricky.map((card) => card.id)).toEqual(['c']);
    expect(summary.total).toBe(4);
  });

  it('knows when the child last practiced', () => {
    expect(lastPracticedAt({})).toBeNull();
    expect(lastPracticedAt({ a: applyReviewResult(undefined, true, NOW) })).toBe(NOW);
  });
});
