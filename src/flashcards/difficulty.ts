import { ChildProfile, DifficultyChange } from './types';

/** How many recent answers are kept to judge how a child is doing. */
export const RESULTS_KEPT = 20;
/** Answers needed at the current level before it can change. */
export const MIN_RESULTS_TO_ADJUST = 10;

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 4;

/**
 * Adds a finished round's first-try answers to the child's recent results and, when automatic
 * adjustment is on, adds a choice after nearly everything was right (90%+) or removes one when it was
 * hard (under 60%). The results start over after a change, so the new level gets a fair try.
 */
export function recordRound(
  profile: ChildProfile,
  roundResults: boolean[],
  now = Date.now(),
): { profile: ChildProfile; change: DifficultyChange | null } {
  const recent = [...(profile.recentResults ?? []), ...roundResults].slice(-RESULTS_KEPT);
  const updated: ChildProfile = { ...profile, recentResults: recent };
  if (!profile.settings.autoAdjust || recent.length < MIN_RESULTS_TO_ADJUST) return { profile: updated, change: null };

  const accuracy = recent.filter(Boolean).length / recent.length;
  const from = profile.settings.choiceCount;
  const to =
    accuracy >= 0.9 ? Math.min(MAX_CHOICES, from + 1) : accuracy < 0.6 ? Math.max(MIN_CHOICES, from - 1) : from;
  if (to === from) return { profile: updated, change: null };

  const change = { at: now, from, to };
  return {
    profile: { ...profile, settings: { ...profile.settings, choiceCount: to }, recentResults: [], lastAdjustment: change },
    change,
  };
}
