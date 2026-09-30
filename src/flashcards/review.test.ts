import { describe, expect, it } from 'vitest';
import { applyReviewResult, buildPracticeQueue, createInitialReview } from './review';
import { testCard } from './testCards';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

describe('applyReviewResult', () => {
  it('spaces out cards that keep being answered correctly', () => {
    const first = applyReviewResult(undefined, true, NOW);
    expect(first.intervalDays).toBe(1);
    expect(first.nextReviewAt).toBe(NOW + DAY);

    const second = applyReviewResult(first, true, NOW);
    expect(second.intervalDays).toBe(3);

    const third = applyReviewResult(second, true, NOW);
    expect(third.intervalDays).toBe(Math.round(3 * second.easeFactor));
    expect(third.reviewCount).toBe(3);
    expect(third.lastCorrect).toBe(true);
  });

  it('brings a missed card back in a few minutes and starts it over', () => {
    const learned = applyReviewResult(applyReviewResult(undefined, true, NOW), true, NOW);
    const missed = applyReviewResult(learned, false, NOW);
    expect(missed.reviewCount).toBe(0);
    expect(missed.intervalDays).toBe(0);
    expect(missed.nextReviewAt).toBe(NOW + 10 * 60 * 1000);
    expect(missed.easeFactor).toBeLessThan(learned.easeFactor);
    expect(missed.lastCorrect).toBe(false);
  });

  it('never lets the ease factor drop below its floor', () => {
    let review = createInitialReview(NOW);
    for (let miss = 0; miss < 20; miss += 1) review = applyReviewResult(review, false, NOW);
    expect(review.easeFactor).toBeCloseTo(1.3);
  });
});

describe('buildPracticeQueue', () => {
  it('puts due cards first, and missed cards before the others', () => {
    const cards = ['a', 'b', 'c', 'd'].map((id) => testCard(id));
    const progress = {
      a: { ...applyReviewResult(undefined, true, NOW - 2 * DAY) }, // due a day ago
      b: { ...applyReviewResult(undefined, false, NOW - DAY) }, // missed, due
      c: { ...applyReviewResult(undefined, true, NOW) }, // due tomorrow
      // d has never been practiced, so it's due now
    };
    const plan = buildPracticeQueue(cards, progress, NOW);
    expect(plan.hasDue).toBe(true);
    expect(plan.dueCount).toBe(3);
    expect(plan.queue.map((card) => card.id)).toEqual(['b', 'a', 'd', 'c']);
  });

  it('says when the next card is due when nothing is due yet', () => {
    const cards = [testCard('a'), testCard('b')];
    const progress = {
      a: applyReviewResult(undefined, true, NOW), // tomorrow
      b: applyReviewResult(applyReviewResult(undefined, true, NOW), true, NOW), // in 3 days
    };
    const plan = buildPracticeQueue(cards, progress, NOW);
    expect(plan.hasDue).toBe(false);
    expect(plan.nextReviewAt).toBe(NOW + DAY);
    expect(plan.queue[0].id).toBe('a');
  });
});
