import { describe, expect, it } from 'vitest';
import { recordRound } from './difficulty';
import { defaultPracticeSettings } from './practice';
import { ChildProfile } from './types';

const child = (choiceCount: number, recentResults: boolean[] = [], autoAdjust = true): ChildProfile => ({
  id: 'kid',
  name: 'Ivy',
  avatar: '🦊',
  createdAt: 0,
  settings: { ...defaultPracticeSettings(), choiceCount, autoAdjust },
  recentResults,
});

const results = (right: number, wrong: number) => [...Array(right).fill(true), ...Array(wrong).fill(false)];

describe('recordRound', () => {
  it('waits for enough answers before changing anything', () => {
    const { profile, change } = recordRound(child(2), results(5, 0));
    expect(change).toBeNull();
    expect(profile.recentResults).toHaveLength(5);
    expect(profile.settings.choiceCount).toBe(2);
  });

  it('adds a choice when nearly everything is right', () => {
    const { profile, change } = recordRound(child(2, results(5, 0)), results(5, 0), 123);
    expect(change).toEqual({ at: 123, from: 2, to: 3 });
    expect(profile.settings.choiceCount).toBe(3);
    expect(profile.lastAdjustment).toEqual(change);
    expect(profile.recentResults).toEqual([]);
  });

  it('removes a choice when it has been hard', () => {
    const { profile, change } = recordRound(child(4, results(3, 2)), results(2, 3));
    expect(change).toMatchObject({ from: 4, to: 3 });
    expect(profile.settings.choiceCount).toBe(3);
  });

  it('stays put in between, and within 2 to 4 choices', () => {
    expect(recordRound(child(3), results(8, 2)).change).toBeNull();
    expect(recordRound(child(4), results(10, 0)).change).toBeNull();
    expect(recordRound(child(2), results(0, 10)).change).toBeNull();
  });

  it('only keeps the last 20 answers', () => {
    const { profile } = recordRound(child(3, results(15, 0)), results(7, 3));
    expect(profile.recentResults).toHaveLength(20);
  });

  it('does nothing automatic when switched off', () => {
    const { profile, change } = recordRound(child(2, [], false), results(10, 0));
    expect(change).toBeNull();
    expect(profile.settings.choiceCount).toBe(2);
    expect(profile.recentResults).toHaveLength(10);
  });
});
