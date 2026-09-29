export type FlashcardData = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
  audioUrl?: string;
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
};

export type ChildProfile = {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  settings: PracticeSettings;
};

/** One child's spaced-repetition state for one card. */
export type CardProgress = FlashcardReview & {
  profileId: string;
  cardId: string;
};

export const MAX_AUDIO_SECONDS = 10;
