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

    const second = applyReviewResult(first, true, first.nextReviewAt);
    expect(second.intervalDays).toBe(3);

    const third = applyReviewResult(second, true, second.nextReviewAt);
    expect(third.intervalDays).toBe(Math.round(3 * second.easeFactor));
    expect(third.reviewCount).toBe(3);
    expect(third.lastCorrect).toBe(true);
  });

  it('brings a missed card back in a few minutes and starts it over', () => {
    const first = applyReviewResult(undefined, true, NOW);
    const learned = applyReviewResult(first, true, first.nextReviewAt);
    const missed = applyReviewResult(learned, false, learned.nextReviewAt);
    expect(missed.reviewCount).toBe(0);
    expect(missed.intervalDays).toBe(0);
    expect(missed.nextReviewAt).toBe(learned.nextReviewAt + 10 * 60 * 1000);
    expect(missed.easeFactor).toBeLessThan(learned.easeFactor);
    expect(missed.lastCorrect).toBe(false);
  });

  it('never lets the ease factor drop below its floor', () => {
    let review = createInitialReview(NOW);
    for (let miss = 0; miss < 20; miss += 1) review = applyReviewResult(review, false, NOW);
    expect(review.easeFactor).toBeCloseTo(1.3);
  });
});

describe('extra practice', () => {
  it("doesn't stretch the gap when a card is answered right before it's due", () => {
    const learned = applyReviewResult(undefined, true, NOW); // due tomorrow
    const early = applyReviewResult(learned, true, NOW + 60 * 1000);
    expect(early.intervalDays).toBe(learned.intervalDays);
    expect(early.reviewCount).toBe(learned.reviewCount);
    expect(early.nextReviewAt).toBe(learned.nextReviewAt);
    expect(early.lastReviewedAt).toBe(NOW + 60 * 1000);

    const onTime = applyReviewResult(early, true, learned.nextReviewAt);
    expect(onTime.intervalDays).toBe(3);
  });

  it('still counts a miss before the card is due', () => {
    const learned = applyReviewResult(undefined, true, NOW);
    const missed = applyReviewResult(learned, false, NOW + 60 * 1000);
    expect(missed.intervalDays).toBe(0);
    expect(missed.lastCorrect).toBe(false);
  });

  it('remembers the last five answers', () => {
    let review = applyReviewResult(undefined, false, NOW);
    for (const correct of [true, false, true, true, true]) review = applyReviewResult(review, correct, review.nextReviewAt);
    expect(review.recent).toEqual([true, false, true, true, true]);
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
    const bFirst = applyReviewResult(undefined, true, NOW - DAY);
    const progress = {
      a: applyReviewResult(undefined, true, NOW), // tomorrow
      b: applyReviewResult(bFirst, true, bFirst.nextReviewAt), // in 3 days
    };
    const plan = buildPracticeQueue(cards, progress, NOW);
    expect(plan.hasDue).toBe(false);
    expect(plan.nextReviewAt).toBe(NOW + DAY);
    expect(plan.queue[0].id).toBe('a');
  });
});
