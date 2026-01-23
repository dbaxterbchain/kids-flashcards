export type FlashcardData = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
  audioUrl?: string;
  setIds?: string[];
  backgroundColor?: string;
  review?: FlashcardReview;
};

export type FlashcardSet = {
  id: string;
  name: string;
};

export type FlashcardReview = {
  lastReviewedAt: number | null;
  nextReviewAt: number;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastCorrect?: boolean;
  lastScore?: number;
};

export const MAX_AUDIO_SECONDS = 10;
