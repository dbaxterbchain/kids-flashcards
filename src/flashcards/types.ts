export type FlashcardData = {
  id: string;
  /** The word or answer on the back of the card; also what gets read aloud. */
  name: string;
  imageUrl: string;
  /** Text shown on the front instead of a picture, e.g. "2 + 3" or "A". */
  frontText?: string;
  createdAt: number;
  audioUrl?: string;
  /** Language to read the word aloud in (e.g. "es-ES"); the device's language when not set. */
  lang?: string;
  setIds?: string[];
  backgroundColor?: string;
  /** Progress saved before practice was tracked per child; copied to the first child a parent adds. */
  review?: FlashcardReview;
};

export type FlashcardSet = {
  id: string;
  name: string;
};

/** Pseudo-set used for cards that aren't in any set. */
export const UNCATEGORIZED_SET_ID = 'uncategorized';

export type FlashcardReview = {
  lastReviewedAt: number | null;
  nextReviewAt: number;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastCorrect?: boolean;
  lastScore?: number;
  /** The last few first-try results for this card, oldest first. */
  recent?: boolean[];
};

/**
 * find-picture: hear/see the word, tap its picture (pre-readers).
 * name-picture: see the picture, tap its word (readers).
 */
export type PromptMode = 'find-picture' | 'name-picture' | 'mix';

export type PracticeSettings = {
  /** Sets to practice; null means every set, including ones added later. */
  setIds: string[] | null;
  choiceCount: number;
  promptMode: PromptMode;
  roundSize: number;
  readAloud: boolean;
  soundEffects: boolean;
  /** Show and say cards the child hasn't met yet before asking about them. */
  introduceNew: boolean;
  /** Add or remove an answer choice as the child gets better or struggles. */
  autoAdjust: boolean;
};

/** An automatic change to how many answers a child chooses from. */
export type DifficultyChange = {
  at: number;
  from: number;
  to: number;
};

export type ChildProfile = {
  id: string;
  name: string;
  /** Emoji avatar; also the fallback when a photo avatar is removed. */
  avatar: string;
  /** Optional photo avatar (a small, square data URL chosen from the parent's own pictures). */
  avatarImage?: string;
  createdAt: number;
  settings: PracticeSettings;
  /** First-try answers since the number of choices last changed, oldest first. */
  recentResults?: boolean[];
  /** The last automatic change to the number of choices, to tell grown-ups about. */
  lastAdjustment?: DifficultyChange;
};

/** One child's spaced-repetition state for one card. */
export type CardProgress = FlashcardReview & {
  profileId: string;
  cardId: string;
};

export const MAX_AUDIO_SECONDS = 10;
